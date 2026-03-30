use anchor_lang::prelude::*;
use crate::state::{Campaign, MilestoneAccount, MilestoneStatus, AiDecision, QadamConfig};
use crate::errors::QadamError;
use crate::events::MilestoneUnderReview;

pub fn handler(
    ctx: Context<MarkUnderHumanReview>,
    _milestone_index: u8,
    ai_decision_hash: [u8; 32],
) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(!config.paused, QadamError::ProgramPaused);

    // Only AI agent can mark for human review
    require!(
        ctx.accounts.authority.key() == config.ai_agent_wallet,
        QadamError::UnauthorizedSigner
    );

    let milestone = &mut ctx.accounts.milestone;
    require!(
        milestone.status == MilestoneStatus::Submitted,
        QadamError::InvalidMilestoneStatus
    );

    milestone.status = MilestoneStatus::UnderHumanReview;
    milestone.ai_decision = AiDecision::Partial;
    milestone.ai_decision_hash = ai_decision_hash;
    milestone.decided_at = Clock::get()?.unix_timestamp;

    emit!(MilestoneUnderReview {
        campaign: ctx.accounts.campaign.key(),
        milestone_index: milestone.index,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct MarkUnderHumanReview<'info> {
    /// AI agent wallet
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
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
}
