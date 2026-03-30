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
    /// AI verification decision
    pub ai_decision: AiDecision,
    /// SHA-256 hash of full Claude response (for audit trail)
    pub ai_decision_hash: [u8; 32],
    /// When evidence was submitted (unix timestamp)
    pub submitted_at: i64,
    /// When AI/admin made decision (unix timestamp)
    pub decided_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MilestoneStatus {
    /// Waiting for creator to submit evidence
    Pending,
    /// Deadline passed, creator has 7 days grace
    GracePeriod,
    /// Creator submitted evidence, awaiting AI
    Submitted,
    /// AI is processing (set by backend, not on-chain)
    AIProcessing,
    /// AI returned PARTIAL, waiting for human reviewer
    UnderHumanReview,
    /// AI or human approved — SOL released
    Approved,
    /// AI or human rejected
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AiDecision {
    /// No decision yet
    None,
    /// AI approved the milestone
    Approved,
    /// AI rejected the milestone
    Rejected,
    /// AI partially approved (needs human review)
    Partial,
}
