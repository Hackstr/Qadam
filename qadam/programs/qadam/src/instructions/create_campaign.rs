use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_interface::{Mint, TokenInterface};
use crate::state::{Campaign, CampaignStatus, QadamConfig, TierConfig, MAX_TIERS};
use crate::constants::{MAX_MILESTONES, MAX_TITLE_LEN, SECURITY_DEPOSIT_BPS};
use crate::errors::QadamError;
use crate::helpers::math::bps_of;
use crate::events::CampaignCreated;

pub fn handler(
    ctx: Context<CreateCampaign>,
    title: String,
    nonce: u64,
    milestones_count: u8,
    total_goal_lamports: u64,
    tokens_per_lamport: u64,
    // Foundation v1: per-campaign tier config
    tier_configs_input: Vec<TierConfig>,
    // Foundation v1: per-campaign voting params
    vote_period_days: u8,
    quorum_bps: u16,
    approval_threshold_bps: u16,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);
    require!(title.len() <= MAX_TITLE_LEN, QadamError::TitleTooLong);
    require!(
        milestones_count > 0 && milestones_count <= MAX_MILESTONES,
        QadamError::TooManyMilestones
    );
    require!(total_goal_lamports > 0, QadamError::BelowMinimumBacking);

    // ── Validate tier config ──
    let tiers_count = tier_configs_input.len();
    require!(tiers_count >= 1 && tiers_count <= MAX_TIERS, QadamError::TooManyMilestones); // reuse error
    require!(tier_configs_input[0].multiplier_bps == 10_000, QadamError::InvalidCampaignStatus); // first tier = 100%

    // Monotonically non-increasing multipliers
    for i in 1..tiers_count {
        require!(
            tier_configs_input[i].multiplier_bps <= tier_configs_input[i - 1].multiplier_bps,
            QadamError::InvalidCampaignStatus
        );
    }

    // Last tier must have max_spots = 0 (unlimited)
    require!(
        tier_configs_input[tiers_count - 1].max_spots == 0,
        QadamError::InvalidCampaignStatus
    );

    // ── Validate voting params ──
    require!(vote_period_days >= 3 && vote_period_days <= 14, QadamError::InvalidCampaignStatus);
    require!(quorum_bps >= 1_000 && quorum_bps <= 5_000, QadamError::InvalidCampaignStatus);
    require!(approval_threshold_bps >= 5_000 && approval_threshold_bps <= 7_500, QadamError::InvalidCampaignStatus);

    // Calculate security deposit (0.5% of goal)
    let security_deposit = bps_of(total_goal_lamports, SECURITY_DEPOSIT_BPS as u64)?;

    // Transfer security deposit from creator to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.campaign_vault.to_account_info(),
            },
        ),
        security_deposit,
    )?;

    // Initialize campaign
    let campaign = &mut ctx.accounts.campaign;
    campaign.creator = ctx.accounts.creator.key();
    campaign.title = title;
    campaign.nonce = nonce;
    campaign.total_goal_lamports = total_goal_lamports;
    campaign.raised_lamports = 0;
    campaign.vault_balance = security_deposit;
    campaign.backer_count = 0;
    campaign.token_mint = ctx.accounts.token_mint.key();
    campaign.tokens_per_lamport = tokens_per_lamport;
    campaign.total_tokens_allocated = 0;
    campaign.milestones_count = milestones_count;
    campaign.milestones_initialized = 0;
    campaign.milestones_approved = 0;
    campaign.status = CampaignStatus::Draft;
    campaign.milestone_amounts = [0u64; MAX_MILESTONES as usize];
    campaign.security_deposit_lamports = security_deposit;
    campaign.security_deposit_remaining = security_deposit;
    campaign.refund_snapshot_vault_balance = 0;
    campaign.positions_closed = 0;
    campaign.created_at = Clock::get()?.unix_timestamp;

    // Foundation v1: store tier configs
    campaign.tiers_count = tiers_count as u8;
    let mut configs = [TierConfig::default(); MAX_TIERS];
    for (i, tc) in tier_configs_input.iter().enumerate() {
        configs[i] = *tc;
    }
    campaign.tier_configs = configs;

    // Foundation v1: store voting params
    campaign.vote_period_days = vote_period_days;
    campaign.quorum_bps = quorum_bps;
    campaign.approval_threshold_bps = approval_threshold_bps;

    campaign.bump = ctx.bumps.campaign;

    emit!(CampaignCreated {
        campaign: campaign.key(),
        creator: campaign.creator,
        goal_lamports: total_goal_lamports,
        milestones_count,
        token_mint: campaign.token_mint,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String, nonce: u64, milestones_count: u8, total_goal_lamports: u64, tokens_per_lamport: u64)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    /// Campaign PDA
    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::INIT_SPACE,
        seeds = [b"campaign", creator.key().as_ref(), &nonce.to_le_bytes()],
        bump,
    )]
    pub campaign: Account<'info, Campaign>,

    /// Vault PDA — holds native SOL (backer funds + deposit)
    /// CHECK: This is a PDA system account used as SOL vault, no data validation needed
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,

    /// SPL Token Mint for this campaign's tokens
    /// Mint authority = Campaign PDA (so only program can mint via claim_tokens)
    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = campaign,
        seeds = [b"mint", campaign.key().as_ref()],
        bump,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
