use anchor_lang::prelude::*;
use crate::state::QadamConfig;
use crate::errors::QadamError;

pub fn handler(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    let config = &mut ctx.accounts.config;
    require!(
        ctx.accounts.admin.key() == config.admin_wallet,
        QadamError::Unauthorized
    );
    config.paused = paused;
    Ok(())
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,
}
