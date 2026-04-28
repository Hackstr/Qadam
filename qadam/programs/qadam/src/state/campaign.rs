use anchor_lang::prelude::*;
use crate::constants::MAX_MILESTONES;

/// Maximum number of tiers per campaign
pub const MAX_TIERS: usize = 10;

/// Per-tier configuration stored on-chain
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Default)]
pub struct TierConfig {
    /// Multiplier in basis points (10000 = 100%, 7000 = 70%)
    pub multiplier_bps: u16,
    /// Max spots for this tier. 0 = unlimited (used for last tier)
    pub max_spots: u32,
}

#[account]
#[derive(InitSpace)]
pub struct Campaign {
    /// Creator's wallet address
    pub creator: Pubkey,
    /// Campaign title (max 100 bytes)
    #[max_len(100)]
    pub title: String,
    /// Nonce for PDA uniqueness (creator can have multiple campaigns)
    pub nonce: u64,
    /// Total funding goal in lamports
    pub total_goal_lamports: u64,
    /// Total SOL raised from backers
    pub raised_lamports: u64,
    /// Current SOL balance in vault (decreases on release/refund)
    pub vault_balance: u64,
    /// Number of unique backers
    pub backer_count: u32,
    /// SPL Token mint address for this campaign's tokens
    pub token_mint: Pubkey,
    /// Base token rate: tokens per lamport for Tier 1 backers
    pub tokens_per_lamport: u64,
    /// Sum of all backer token allocations (for quorum calculation)
    pub total_tokens_allocated: u64,
    /// Number of milestones for this campaign (1-5)
    pub milestones_count: u8,
    /// How many milestones have been initialized via add_milestone
    pub milestones_initialized: u8,
    /// How many milestones have been approved and released
    pub milestones_approved: u8,
    /// Campaign lifecycle status
    pub status: CampaignStatus,
    /// Amount of each milestone in lamports (indexed by milestone index)
    pub milestone_amounts: [u64; MAX_MILESTONES as usize],
    /// Original security deposit in lamports (0.5% of goal)
    pub security_deposit_lamports: u64,
    /// Remaining unreturned deposit
    pub security_deposit_remaining: u64,
    /// Vault balance snapshot taken when entering Refunded status
    pub refund_snapshot_vault_balance: u64,
    /// Counter of closed backer positions (for close_campaign check)
    pub positions_closed: u32,
    /// Unix timestamp of campaign creation
    pub created_at: i64,

    // ── Foundation v1: Per-campaign tier config ──
    /// Number of active tiers (1-10). Only first `tiers_count` entries in `tier_configs` are used.
    pub tiers_count: u8,
    /// Fixed-size array of tier configs. Only first `tiers_count` entries matter.
    pub tier_configs: [TierConfig; MAX_TIERS],

    // ── Foundation v1: Per-campaign voting params ──
    /// How many days voting stays open (3-14)
    pub vote_period_days: u8,
    /// Quorum in basis points (1000 = 10%, 5000 = 50%)
    pub quorum_bps: u16,
    /// Approval threshold in basis points (5000 = 50%, 7500 = 75%)
    pub approval_threshold_bps: u16,

    /// PDA bump seed
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CampaignStatus {
    /// Milestones being added
    Draft,
    /// Open for backing
    Active,
    /// All milestones approved
    Completed,
    /// Refund triggered — backers can claim_refund
    Refunded,
    /// Admin paused this specific campaign
    Paused,
    /// Creator cancelled (no backers) — deposit returned
    Cancelled,
}
