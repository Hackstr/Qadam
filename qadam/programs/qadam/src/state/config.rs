use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct QadamConfig {
    /// Admin wallet — can pause, override decisions, manage config
    pub admin_wallet: Pubkey,
    /// AI agent wallet — signs release_milestone transactions
    pub ai_agent_wallet: Pubkey,
    /// Qadam treasury — receives 2.5% fees
    pub qadam_treasury: Pubkey,
    /// Emergency pause flag
    pub paused: bool,
    /// PDA bump seed
    pub bump: u8,
}
