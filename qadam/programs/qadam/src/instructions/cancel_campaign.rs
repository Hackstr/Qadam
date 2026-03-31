use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus};
use crate::errors::QadamError;

/// Creator can cancel a campaign that has no backers.
/// Returns the security deposit to creator.
/// This prevents funds getting stuck in campaigns nobody backed.
pub fn handler(ctx: Context<CancelCampaign>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Active
        || campaign.status == CampaignStatus::Draft,
        QadamError::InvalidCampaignStatus
    );

    // Can only cancel if no backers — otherwise use governance
    require!(campaign.backer_count == 0, QadamError::CampaignHasBackers);

    // Return deposit from vault to creator
    let deposit = campaign.vault_balance;
    if deposit > 0 {
        let campaign_key = campaign.key();
        let vault_seeds: &[&[u8]] = &[b"vault", campaign_key.as_ref(), &[ctx.bumps.campaign_vault]];
        let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.campaign_vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            deposit,
        )?;

        campaign.vault_balance = 0;
        campaign.security_deposit_remaining = 0;
    }

    campaign.status = CampaignStatus::Cancelled;

    Ok(())
}

#[derive(Accounts)]
pub struct CancelCampaign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"campaign", creator.key().as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
        has_one = creator @ QadamError::NotCreator,
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}
