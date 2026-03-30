use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus, BackerPosition, QadamConfig};
use crate::constants::{MIN_BACKING_LAMPORTS, TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS, TIER_2_RATIO_BPS, TIER_3_RATIO_BPS, BPS_DENOMINATOR};
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, safe_add};
use crate::events::CampaignBacked;

pub fn handler(ctx: Context<BackCampaign>, amount_lamports: u64) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &mut ctx.accounts.campaign;
    require!(campaign.status == CampaignStatus::Active, QadamError::CampaignNotActive);
    require!(amount_lamports >= MIN_BACKING_LAMPORTS, QadamError::BelowMinimumBacking);

    // Determine tier based on current backer count
    let tier: u8 = if campaign.backer_count < TIER_1_MAX_BACKERS {
        1
    } else if campaign.backer_count < TIER_2_MAX_BACKERS {
        2
    } else {
        3
    };

    // Calculate tokens allocated (integer math only)
    let base_tokens = amount_lamports
        .checked_mul(campaign.tokens_per_lamport)
        .ok_or(QadamError::MathOverflow)?;

    let tokens_allocated = match tier {
        1 => base_tokens,
        2 => mul_div(base_tokens, TIER_2_RATIO_BPS, BPS_DENOMINATOR)?,
        _ => mul_div(base_tokens, TIER_3_RATIO_BPS, BPS_DENOMINATOR)?,
    };

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
    position.tier = tier;
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
        tier,
        tokens_allocated,
    });

    Ok(())
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
