use anchor_lang::prelude::*;

#[error_code]
pub enum QadamError {
    // Auth / Admin
    #[msg("Only the admin wallet can perform this action")]
    Unauthorized,

    #[msg("Only the AI agent or admin wallet can perform this action")]
    UnauthorizedSigner,

    #[msg("Program is paused by admin")]
    ProgramPaused,

    // Campaign
    #[msg("Campaign is not in the expected status")]
    InvalidCampaignStatus,

    #[msg("Campaign title exceeds maximum length")]
    TitleTooLong,

    #[msg("Too many milestones (max 5)")]
    TooManyMilestones,

    #[msg("Milestone amounts must sum to campaign goal")]
    MilestoneAmountMismatch,

    #[msg("All milestones must be added before activating")]
    MilestonesNotComplete,

    #[msg("Milestone deadline must be in the future")]
    DeadlineInPast,

    // Backing
    #[msg("Campaign is not active for backing")]
    CampaignNotActive,

    #[msg("Backing amount is below minimum (0.1 SOL)")]
    BelowMinimumBacking,

    // Milestones
    #[msg("Milestone is not in the expected status")]
    InvalidMilestoneStatus,

    #[msg("Only the campaign creator can perform this action")]
    NotCreator,

    #[msg("Milestones must be submitted in order")]
    MilestoneOutOfOrder,

    // Tokens
    #[msg("No tokens available to claim")]
    NothingToClaim,

    // Governance
    #[msg("Not a backer of this campaign")]
    NotABacker,

    #[msg("Already voted on this extension")]
    AlreadyVoted,

    #[msg("Voting period has not ended yet")]
    VotingNotEnded,

    #[msg("Voting period has already ended")]
    VotingEnded,

    #[msg("Extension result already executed")]
    AlreadyExecuted,

    #[msg("New deadline exceeds maximum extension period")]
    ExtensionTooLong,

    // Refund
    #[msg("Campaign is not in refunded status")]
    NotRefunded,

    #[msg("Refund already claimed")]
    AlreadyRefunded,

    // Cleanup
    #[msg("Campaign is still active — cannot close")]
    CampaignStillActive,

    #[msg("Tokens not fully claimed — cannot close position")]
    TokensNotClaimed,

    #[msg("Refund not claimed — cannot close position")]
    RefundNotClaimed,

    #[msg("Not all backer positions are closed yet")]
    PositionsNotClosed,

    // Cancel
    #[msg("Campaign has backers — cannot cancel, use governance")]
    CampaignHasBackers,

    #[msg("Milestone grace deadline has passed — too late to submit")]
    PastGraceDeadline,

    // Math
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
