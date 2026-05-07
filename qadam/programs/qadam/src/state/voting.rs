use anchor_lang::prelude::*;

/// Discriminator for vote types. Stored as u8 on-chain.
/// 0 = MilestoneApproval (milestone vote after evidence submit)
/// 1 = ExtensionGrant (creator-requested deadline extension)
/// 2 = Refund (community-initiated refund — Block 3, not used in Pass A)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VoteType {
    MilestoneApproval,
    ExtensionGrant,
    Refund,
}

/// Resolution outcome of a vote.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VoteResolution {
    Unresolved,
    Approved,
    Rejected,
}

/// Aggregate state for an active or resolved vote, regardless of type.
/// One per active vote. PDA seeds: [b"vote_state", &[vote_type as u8], context.as_ref()]
#[account]
#[derive(InitSpace)]
pub struct VotingState {
    pub vote_type: VoteType,
    /// Campaign this vote belongs to (for fast off-chain filtering)
    pub campaign: Pubkey,
    /// Context account for this vote — the milestone PDA for type 1 and 2,
    /// the milestone PDA again for type 3 (refund triggered by a milestone)
    pub context: Pubkey,
    /// Voting deadline as unix seconds
    pub voting_deadline: i64,
    /// Sum of voting power on the approve side
    pub approve_power: u64,
    /// Sum of voting power on the reject side
    pub reject_power: u64,
    /// Number of distinct voters (informational; for analytics)
    pub votes_count: u32,
    /// True after resolve_vote has run successfully
    pub resolved: bool,
    /// Outcome — only meaningful when resolved == true
    pub resolution: VoteResolution,
    /// When resolution happened (0 until resolved)
    pub resolved_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

/// Individual vote record. One per (voting_state, voter).
/// PDA seeds: [b"vote", voting_state.as_ref(), voter.as_ref()]
#[account]
#[derive(InitSpace)]
pub struct Vote {
    pub voting_state: Pubkey,
    pub voter: Pubkey,
    /// Voting power as captured at the time the vote was cast
    /// (snapshotted from BackerPosition.tokens_allocated)
    pub voting_power: u64,
    pub approve: bool,
    pub voted_at: i64,
    pub bump: u8,
}
