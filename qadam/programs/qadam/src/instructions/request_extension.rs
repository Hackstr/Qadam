use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, ExtensionVotingState, QadamConfig};
use crate::constants::MAX_EXTENSION_SECONDS;
use crate::errors::QadamError;
use crate::events::ExtensionRequested;

pub fn handler(
    ctx: Context<RequestExtension>,
    _milestone_index: u8,
    reason_hash: [u8; 32],
    new_deadline: i64,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &ctx.accounts.campaign;
    require!(
        campaign.status == CampaignStatus::Active,
        QadamError::InvalidCampaignStatus
    );

    {
        let milestone = &ctx.accounts.milestone;
        require!(
            milestone.status == MilestoneStatus::GracePeriod
            || milestone.status == MilestoneStatus::Failed
            || milestone.status == MilestoneStatus::Rejected,
            QadamError::InvalidMilestoneStatus
        );
    }

    let now = Clock::get()?.unix_timestamp;
    require!(new_deadline > now, QadamError::DeadlineInPast);
    require!(
        new_deadline <= now + MAX_EXTENSION_SECONDS,
        QadamError::ExtensionTooLong
    );

    let milestone_key = ctx.accounts.milestone.key();

    // Update milestone status
    let milestone = &mut ctx.accounts.milestone;
    milestone.status = MilestoneStatus::VotingActive;
    // Store reason hash in evidence field (reuse)
    milestone.evidence_content_hash = reason_hash;

    // Initialize voting state
    let voting = &mut ctx.accounts.voting_state;
    voting.milestone = milestone_key;
    voting.total_approve_power = 0;
    voting.total_reject_power = 0;
    // Use per-campaign vote_period_days
    let vote_period_secs = (campaign.vote_period_days as i64) * 24 * 60 * 60;
    voting.voting_deadline = now + vote_period_secs;
    voting.proposed_deadline = new_deadline;
    voting.executed = false;
    voting.bump = ctx.bumps.voting_state;

    emit!(ExtensionRequested {
        campaign: campaign.key(),
        milestone_index: milestone.index,
        new_deadline,
        voting_deadline: voting.voting_deadline,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct RequestExtension<'info> {
    #[account(mut)]
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

    #[account(
        init,
        payer = creator,
        space = 8 + ExtensionVotingState::INIT_SPACE,
        seeds = [b"voting", milestone.key().as_ref()],
        bump,
    )]
    pub voting_state: Account<'info, ExtensionVotingState>,

    pub system_program: Program<'info, System>,
}
