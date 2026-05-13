use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, CampaignStatus};
use crate::errors::QadamError;

pub fn handler(ctx: Context<CloseCampaign>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Completed
        || campaign.status == CampaignStatus::Refunded
        || campaign.status == CampaignStatus::Cancelled,
        QadamError::CampaignStillActive
    );

    // Cancelled campaigns have no backers, skip positions check
    if campaign.status != CampaignStatus::Cancelled {
        require!(
            campaign.positions_closed == campaign.backer_count,
            QadamError::PositionsNotClosed
        );
    }

    // Transfer any remaining vault lamports back to creator (rent reclaim)
    let vault = &ctx.accounts.campaign_vault;
    let vault_lamports = vault.lamports();
    if vault_lamports > 0 {
        let campaign_key = campaign.key();
        let vault_seeds = &[
            b"vault",
            campaign_key.as_ref(),
            &[ctx.bumps.campaign_vault],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            vault_lamports,
        )?;
    }

    // Campaign account closed by Anchor's close constraint → rent goes to creator
    Ok(())
}

#[derive(Accounts)]
pub struct CloseCampaign<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [b"campaign", creator.key().as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
        has_one = creator @ QadamError::NotCreator,
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: Vault PDA — any remaining lamports returned to creator
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
