use anchor_lang::prelude::*;
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
}
