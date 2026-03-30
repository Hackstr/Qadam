use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, BackerPosition};
use crate::errors::QadamError;

pub fn handler(ctx: Context<CloseBackerPosition>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let position = &ctx.accounts.backer_position;

    require!(
        campaign.status == CampaignStatus::Completed
        || campaign.status == CampaignStatus::Refunded,
        QadamError::CampaignStillActive
    );

    if campaign.status == CampaignStatus::Completed {
        require!(
            position.milestones_claimed_through == campaign.milestones_count,
            QadamError::TokensNotClaimed
        );
    } else {
        // Refunded
        require!(position.refund_claimed, QadamError::RefundNotClaimed);
    }

    // Increment positions_closed counter (for close_campaign check)
    campaign.positions_closed = campaign.positions_closed
        .checked_add(1)
        .ok_or(QadamError::MathOverflow)?;

    // Account is closed by Anchor's close constraint → rent goes to backer
    Ok(())
}

#[derive(Accounts)]
pub struct CloseBackerPosition<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        close = backer,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump = backer_position.bump,
        has_one = backer @ QadamError::NotABacker,
    )]
    pub backer_position: Account<'info, BackerPosition>,
}
