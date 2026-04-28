use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus, BackerPosition, QadamConfig};
use crate::constants::{MIN_BACKING_LAMPORTS, BPS_DENOMINATOR};
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, safe_add};
use crate::events::CampaignBacked;

pub fn handler(ctx: Context<BackCampaign>, amount_lamports: u64) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &mut ctx.accounts.campaign;
    require!(campaign.status == CampaignStatus::Active, QadamError::CampaignNotActive);
    require!(amount_lamports >= MIN_BACKING_LAMPORTS, QadamError::BelowMinimumBacking);

    // Determine tier from per-campaign tier_configs
    let (tier_index, multiplier_bps) = determine_tier(campaign)?;

    // Calculate tokens allocated using tier multiplier
    let base_tokens = amount_lamports
        .checked_mul(campaign.tokens_per_lamport)
        .ok_or(QadamError::MathOverflow)?;

    let tokens_allocated = mul_div(base_tokens, multiplier_bps as u64, BPS_DENOMINATOR)?;

    // Transfer SOL from backer to vault PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.backer.to_account_info(),
                to: ctx.accounts.campaign_vault.to_account_info(),
            },
        ),
        amount_lamports,
    )?;

    // Update campaign
    campaign.raised_lamports = safe_add(campaign.raised_lamports, amount_lamports)?;
    campaign.vault_balance = safe_add(campaign.vault_balance, amount_lamports)?;
    campaign.backer_count = campaign.backer_count
        .checked_add(1)
        .ok_or(QadamError::MathOverflow)?;
    campaign.total_tokens_allocated = safe_add(campaign.total_tokens_allocated, tokens_allocated)?;

    // Initialize backer position
    let position = &mut ctx.accounts.backer_position;
    position.campaign = campaign.key();
    position.backer = ctx.accounts.backer.key();
    position.lamports_backed = amount_lamports;
    position.tier = tier_index + 1; // 1-indexed for display (Tier 1, 2, 3...)
    position.tokens_allocated = tokens_allocated;
    position.tokens_claimed = 0;
    position.milestones_claimed_through = 0;
    position.refund_claimed = false;
    position.backed_at = Clock::get()?.unix_timestamp;
    position.bump = ctx.bumps.backer_position;

    emit!(CampaignBacked {
        campaign: campaign.key(),
        backer: ctx.accounts.backer.key(),
        amount_lamports,
        tier: tier_index + 1,
        tokens_allocated,
    });

    Ok(())
}

/// Determine which tier a new backer falls into based on campaign's tier_configs
/// and current backer_count. Returns (tier_index, multiplier_bps).
fn determine_tier(campaign: &Campaign) -> Result<(u8, u16)> {
    let backer_count = campaign.backer_count;
    let mut cumulative_spots: u32 = 0;

    for i in 0..campaign.tiers_count as usize {
        let tier = &campaign.tier_configs[i];

        // Last tier (or tier with max_spots=0 meaning unlimited) catches all
        if tier.max_spots == 0 || i == (campaign.tiers_count as usize - 1) {
            return Ok((i as u8, tier.multiplier_bps));
        }

        cumulative_spots = cumulative_spots
            .checked_add(tier.max_spots)
            .ok_or(QadamError::MathOverflow)?;

        if backer_count < cumulative_spots {
            return Ok((i as u8, tier.multiplier_bps));
        }
    }

    // Fallback to last tier (should not reach here if tier_configs is valid)
    let last_idx = (campaign.tiers_count as usize).saturating_sub(1);
    Ok((last_idx as u8, campaign.tier_configs[last_idx].multiplier_bps))
}

#[derive(Accounts)]
pub struct BackCampaign<'info> {
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
        init,
        payer = backer,
        space = 8 + BackerPosition::INIT_SPACE,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    pub system_program: Program<'info, System>,
}
