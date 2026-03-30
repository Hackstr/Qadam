use anchor_lang::prelude::*;
use crate::state::QadamConfig;

pub fn handler(
    ctx: Context<InitializeConfig>,
    admin_wallet: Pubkey,
    ai_agent_wallet: Pubkey,
    qadam_treasury: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin_wallet = admin_wallet;
    config.ai_agent_wallet = ai_agent_wallet;
    config.qadam_treasury = qadam_treasury;
    config.paused = false;
    config.bump = ctx.bumps.config;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + QadamConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, QadamConfig>,

    pub system_program: Program<'info, System>,
}
