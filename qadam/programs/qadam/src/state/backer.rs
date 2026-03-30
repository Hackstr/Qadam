use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct BackerPosition {
    /// Parent campaign pubkey
    pub campaign: Pubkey,
    /// Backer's wallet address
    pub backer: Pubkey,
    /// Total SOL backed in lamports
    pub lamports_backed: u64,
    /// Tier at first backing (1, 2, or 3) — does not change on increase
    pub tier: u8,
    /// Total tokens allocated (rights, not minted yet)
    pub tokens_allocated: u64,
    /// Tokens already claimed/minted
    pub tokens_claimed: u64,
    /// Index of last milestone claimed through (0 = none claimed)
    pub milestones_claimed_through: u8,
    /// Whether refund has been claimed
    pub refund_claimed: bool,
    /// Unix timestamp of first backing
    pub backed_at: i64,
    /// PDA bump seed
    pub bump: u8,
}
