use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct QadamConfig {
    /// Admin wallet — can pause, manage config
    pub admin_wallet: Pubkey,
    /// Qadam treasury — receives 2.5% fees
    pub qadam_treasury: Pubkey,
    /// Emergency pause flag
    pub paused: bool,
    /// PDA bump seed
    pub bump: u8,
}
