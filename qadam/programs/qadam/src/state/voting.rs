use anchor_lang::prelude::*;

/// Aggregate voting state for a milestone extension request
#[account]
#[derive(InitSpace)]
pub struct ExtensionVotingState {
    /// The milestone this vote is for
    pub milestone: Pubkey,
    /// Sum of voting power for "extend"
    pub total_approve_power: u64,
    /// Sum of voting power for "refund"
    pub total_reject_power: u64,
    /// Voting deadline (unix timestamp)
    pub voting_deadline: i64,
    /// Proposed new deadline if extension wins
    pub proposed_deadline: i64,
    /// Whether the result has been executed
    pub executed: bool,
    /// PDA bump seed
    pub bump: u8,
}

/// Individual vote record (one per backer per milestone)
#[account]
#[derive(InitSpace)]
pub struct ExtensionVote {
    /// The milestone this vote is for
    pub milestone: Pubkey,
    /// Voter's wallet address
    pub voter: Pubkey,
    /// Voting power used (capped at 20% of total)
    pub voting_power: u64,
    /// true = extend, false = refund
    pub vote_approve: bool,
    /// Unix timestamp of vote
    pub voted_at: i64,
    /// PDA bump seed
    pub bump: u8,
}
