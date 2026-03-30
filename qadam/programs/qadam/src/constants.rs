/// Qadam fee: 2.5% taken from each milestone release (250 basis points)
pub const QADAM_FEE_BPS: u16 = 250;

/// Security deposit: 0.5% of campaign goal (50 basis points)
pub const SECURITY_DEPOSIT_BPS: u16 = 50;

/// Maximum milestones per campaign
pub const MAX_MILESTONES: u8 = 5;

/// Tier 1 (Genesis): first 50 backers get 1.0x token allocation
pub const TIER_1_MAX_BACKERS: u32 = 50;

/// Tier 2 (Early): backers 51-250 get 0.67x token allocation
pub const TIER_2_MAX_BACKERS: u32 = 250;

/// Tier 2 ratio: 67% of base rate (6700 basis points)
pub const TIER_2_RATIO_BPS: u64 = 6_700;

/// Tier 3 ratio: 50% of base rate (5000 basis points)
pub const TIER_3_RATIO_BPS: u64 = 5_000;

/// Basis points denominator
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Grace period after milestone deadline: 7 days
pub const GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;

/// Voting period for extension requests: 7 days
pub const VOTING_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;

/// Maximum extension: 30 days from current time
pub const MAX_EXTENSION_SECONDS: i64 = 30 * 24 * 60 * 60;

/// Quorum: 20% of total_tokens_allocated must vote (2000 basis points)
pub const QUORUM_BPS: u64 = 2_000;

/// Vote cap: max 20% voting power per single backer position
pub const VOTE_CAP_BPS: u64 = 2_000;

/// Minimum backing amount: 0.1 SOL
pub const MIN_BACKING_LAMPORTS: u64 = 100_000_000;

/// Appeal cost: 0.01 SOL (anti-spam, returned if decision overturned)
pub const APPEAL_COST_LAMPORTS: u64 = 10_000_000;

/// Maximum title length in bytes
pub const MAX_TITLE_LEN: usize = 100;
