use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus, BackerPosition, QadamConfig};
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, safe_sub};
use crate::events::RefundClaimed;

pub fn handler(ctx: Context<ClaimRefund>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let position = &mut ctx.accounts.backer_position;

    require!(
        campaign.status == CampaignStatus::Refunded,
        QadamError::NotRefunded
    );
    require!(!position.refund_claimed, QadamError::AlreadyRefunded);

    // Proportional refund: backer_backed * snapshot / total_raised
    // Uses snapshot to prevent race condition between concurrent claims
    let refund_amount = mul_div(
        position.lamports_backed,
        campaign.refund_snapshot_vault_balance,
        campaign.raised_lamports,
    )?;

    // CPI transfer from vault PDA
    let campaign_key = campaign.key();
    let vault_seeds: &[&[u8]] = &[b"vault", campaign_key.as_ref(), &[ctx.bumps.campaign_vault]];
    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.campaign_vault.to_account_info(),
                to: ctx.accounts.backer.to_account_info(),
            },
            signer_seeds,
        ),
        refund_amount,
    )?;

    position.refund_claimed = true;
    campaign.vault_balance = safe_sub(campaign.vault_balance, refund_amount)?;

    emit!(RefundClaimed {
        campaign: campaign.key(),
        backer: ctx.accounts.backer.key(),
        amount_lamports: refund_amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,

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

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump = backer_position.bump,
        has_one = backer @ QadamError::NotABacker,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    pub system_program: Program<'info, System>,
}
