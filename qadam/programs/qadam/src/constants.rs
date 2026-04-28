/// Qadam fee: 2.5% taken from each milestone release (250 basis points)
pub const QADAM_FEE_BPS: u16 = 250;

/// Security deposit: 0.5% of campaign goal (50 basis points)
pub const SECURITY_DEPOSIT_BPS: u16 = 50;

/// Maximum milestones per campaign
pub const MAX_MILESTONES: u8 = 5;

/// Basis points denominator
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Grace period after milestone deadline: 7 days
pub const GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;

/// Maximum extension: 30 days from current time
pub const MAX_EXTENSION_SECONDS: i64 = 30 * 24 * 60 * 60;

/// Vote cap: max 20% voting power per single backer position
pub const VOTE_CAP_BPS: u64 = 2_000;

/// Minimum backing amount: 0.1 SOL
pub const MIN_BACKING_LAMPORTS: u64 = 100_000_000;

/// Appeal cost: 0.01 SOL (anti-spam, returned if decision overturned)
pub const APPEAL_COST_LAMPORTS: u64 = 10_000_000;

/// Maximum title length in bytes
pub const MAX_TITLE_LEN: usize = 100;

// ── Foundation v1: Removed hardcoded tier constants ──
// TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS, TIER_2_RATIO_BPS, TIER_3_RATIO_BPS
// Now per-campaign via Campaign.tier_configs[]

// ── Foundation v1: Removed hardcoded voting constants ──
// VOTING_PERIOD_SECONDS, QUORUM_BPS
// Now per-campaign via Campaign.vote_period_days, quorum_bps, approval_threshold_bps
