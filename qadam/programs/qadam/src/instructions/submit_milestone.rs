use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, QadamConfig};
use crate::errors::QadamError;
use crate::events::MilestoneSubmitted;

pub fn handler(
    ctx: Context<SubmitMilestone>,
    milestone_index: u8,
    evidence_content_hash: [u8; 32],
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &ctx.accounts.campaign;
    require!(
        campaign.status == CampaignStatus::Active,
        QadamError::InvalidCampaignStatus
    );

    // Milestones must be submitted in order
    require!(
        milestone_index == campaign.milestones_approved,
        QadamError::MilestoneOutOfOrder
    );

    let now = Clock::get()?.unix_timestamp;
    let milestone = &mut ctx.accounts.milestone;

    // Determine effective status based on time
    // On-chain we can't run crons, so we check deadline at submission time
    let effective_status = if milestone.status == MilestoneStatus::Pending && now > milestone.deadline {
        if now <= milestone.grace_deadline {
            MilestoneStatus::GracePeriod
        } else {
            MilestoneStatus::Failed // Past grace period
        }
    } else {
        milestone.status
    };

    require!(
        effective_status == MilestoneStatus::Pending
        || effective_status == MilestoneStatus::GracePeriod
        || effective_status == MilestoneStatus::Rejected
        || effective_status == MilestoneStatus::Extended,
        QadamError::InvalidMilestoneStatus
    );

    milestone.evidence_content_hash = evidence_content_hash;
    milestone.status = MilestoneStatus::Submitted;
    milestone.submitted_at = now;

    emit!(MilestoneSubmitted {
        campaign: campaign.key(),
        milestone_index,
        evidence_content_hash,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct SubmitMilestone<'info> {
    pub creator: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
        seeds = [b"campaign", creator.key().as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
        has_one = creator @ QadamError::NotCreator,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds = [b"milestone", campaign.key().as_ref(), &[milestone_index]],
        bump = milestone.bump,
        constraint = milestone.campaign == campaign.key() @ QadamError::InvalidMilestoneStatus,
    )]
    pub milestone: Account<'info, MilestoneAccount>,
}
