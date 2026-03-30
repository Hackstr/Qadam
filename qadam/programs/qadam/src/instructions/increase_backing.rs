use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus, BackerPosition, QadamConfig};
use crate::constants::{MIN_BACKING_LAMPORTS, TIER_2_RATIO_BPS, TIER_3_RATIO_BPS, BPS_DENOMINATOR};
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, safe_add};

pub fn handler(ctx: Context<IncreaseBacking>, additional_lamports: u64) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &mut ctx.accounts.campaign;
    require!(campaign.status == CampaignStatus::Active, QadamError::CampaignNotActive);
    require!(additional_lamports >= MIN_BACKING_LAMPORTS, QadamError::BelowMinimumBacking);

    let position = &mut ctx.accounts.backer_position;

    // Tier stays the same as original backing
    let base_tokens = additional_lamports
        .checked_mul(campaign.tokens_per_lamport)
        .ok_or(QadamError::MathOverflow)?;

    let additional_tokens = match position.tier {
        1 => base_tokens,
        2 => mul_div(base_tokens, TIER_2_RATIO_BPS, BPS_DENOMINATOR)?,
        _ => mul_div(base_tokens, TIER_3_RATIO_BPS, BPS_DENOMINATOR)?,
    };

    // Transfer SOL
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.backer.to_account_info(),
                to: ctx.accounts.campaign_vault.to_account_info(),
            },
        ),
        additional_lamports,
    )?;

    // Update campaign
    campaign.raised_lamports = safe_add(campaign.raised_lamports, additional_lamports)?;
    campaign.vault_balance = safe_add(campaign.vault_balance, additional_lamports)?;
    campaign.total_tokens_allocated = safe_add(campaign.total_tokens_allocated, additional_tokens)?;

    // Update position (no new backer_count increment — same backer)
    position.lamports_backed = safe_add(position.lamports_backed, additional_lamports)?;
    position.tokens_allocated = safe_add(position.tokens_allocated, additional_tokens)?;

    Ok(())
}

#[derive(Accounts)]
pub struct IncreaseBacking<'info> {
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

    /// CHECK: Vault PDA holding SOL
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
