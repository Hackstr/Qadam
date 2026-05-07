use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MilestoneAccount {
    /// Parent campaign pubkey
    pub campaign: Pubkey,
    /// Milestone index (0-based, sequential)
    pub index: u8,
    /// SOL amount for this milestone in lamports
    pub amount_lamports: u64,
    /// Original deadline (unix timestamp)
    pub deadline: i64,
    /// Grace period deadline (deadline + 7 days)
    pub grace_deadline: i64,
    /// Extended deadline (if extension approved)
    pub extension_deadline: i64,
    /// Current milestone status
    pub status: MilestoneStatus,
    /// SHA-256 hash of evidence content (computed client-side)
    pub evidence_content_hash: [u8; 32],
    /// When evidence was submitted (unix timestamp)
    pub submitted_at: i64,
    /// When decision was made (unix timestamp)
    pub decided_at: i64,
    /// Active voting state for this milestone, if any.
    /// Some(pda) when a vote is open or resolved; None when no vote has ever been opened.
    pub voting_state: Option<Pubkey>,
    /// Number of times the creator has resubmitted evidence after a rejection.
    /// Informational only — backers can see the value but no on-chain logic enforces a cap.
    pub revision_count: u8,
    /// PDA bump seed
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MilestoneStatus {
    /// Waiting for creator to submit evidence
    Pending,
    /// Deadline passed, creator has 7 days grace
    GracePeriod,
    /// Community approved — SOL released
    Approved,
    /// Community rejected
    Rejected,
    /// Creator requested deadline extension, voting open
    ExtensionRequested,
    /// Backer voting is active
    VotingActive,
    /// Deadline was extended after vote
    Extended,
    /// Milestone failed (grace + extension exhausted)
    Failed,
}
