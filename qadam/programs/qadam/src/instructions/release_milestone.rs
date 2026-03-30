use anchor_lang::prelude::*;
use crate::state::{Campaign, MilestoneAccount, MilestoneStatus, QadamConfig};
use crate::errors::QadamError;
use crate::helpers::release::execute_release;

pub fn handler(
    ctx: Context<ReleaseMilestone>,
    _milestone_index: u8,
    ai_decision_hash: [u8; 32],
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(!config.paused, QadamError::ProgramPaused);

    // Only AI agent or admin can release
    let signer = ctx.accounts.authority.key();
    require!(
        signer == config.ai_agent_wallet || signer == config.admin_wallet,
        QadamError::UnauthorizedSigner
    );

    let milestone = &ctx.accounts.milestone;
    require!(
        milestone.status == MilestoneStatus::Submitted,
        QadamError::InvalidMilestoneStatus
    );

    // Use shared release logic
    execute_release(
        &mut ctx.accounts.campaign,
        &mut ctx.accounts.milestone,
        &ctx.accounts.campaign_vault.to_account_info(),
        &ctx.accounts.creator.to_account_info(),
        &ctx.accounts.qadam_treasury.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        ctx.bumps.campaign_vault,
        ai_decision_hash,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct ReleaseMilestone<'info> {
    /// AI agent or admin wallet
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds = [b"milestone", campaign.key().as_ref(), &[milestone_index]],
        bump = milestone.bump,
        constraint = milestone.campaign == campaign.key() @ QadamError::InvalidMilestoneStatus,
    )]
    pub milestone: Account<'info, MilestoneAccount>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,

    /// CHECK: Creator receives milestone payment
    #[account(
        mut,
        constraint = creator.key() == campaign.creator @ QadamError::NotCreator,
    )]
    pub creator: SystemAccount<'info>,

    /// CHECK: Qadam treasury receives fee
    #[account(
        mut,
        constraint = qadam_treasury.key() == config.qadam_treasury @ QadamError::Unauthorized,
    )]
    pub qadam_treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}
