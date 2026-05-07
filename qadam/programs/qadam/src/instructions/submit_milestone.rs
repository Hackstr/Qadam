use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, VotingState, VoteType, VoteResolution, QadamConfig};
use crate::errors::QadamError;
use crate::events::{MilestoneSubmitted, VoteOpened};

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
    let effective_status = if milestone.status == MilestoneStatus::Pending && now > milestone.deadline {
        if now <= milestone.grace_deadline {
            MilestoneStatus::GracePeriod
        } else {
            MilestoneStatus::Failed
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

    // If resubmitting after rejection, increment revision count
    if effective_status == MilestoneStatus::Rejected {
        milestone.revision_count = milestone.revision_count
            .checked_add(1)
            .ok_or(QadamError::MathOverflow)?;
    }

    milestone.evidence_content_hash = evidence_content_hash;
    milestone.submitted_at = now;
    milestone.status = MilestoneStatus::VotingActive;

    // Capture keys before mutable borrows
    let campaign_key = campaign.key();
    let milestone_key = milestone.key();
    let voting_state_key = ctx.accounts.voting_state.key();
    let voting_deadline = now + (campaign.vote_period_days as i64) * 86400;

    // Initialize voting state PDA
    let voting = &mut ctx.accounts.voting_state;
    voting.vote_type = VoteType::MilestoneApproval;
    voting.campaign = campaign_key;
    voting.context = milestone_key;
    voting.voting_deadline = voting_deadline;
    voting.approve_power = 0;
    voting.reject_power = 0;
    voting.votes_count = 0;
    voting.resolved = false;
    voting.resolution = VoteResolution::Unresolved;
    voting.resolved_at = 0;
    voting.bump = ctx.bumps.voting_state;

    milestone.voting_state = Some(voting_state_key);

    emit!(MilestoneSubmitted {
        campaign: campaign_key,
        milestone_index,
        evidence_content_hash,
    });

    emit!(VoteOpened {
        vote_type: 0, // MilestoneApproval
        campaign: campaign_key,
        context: milestone_key,
        voting_state: voting_state_key,
        voting_deadline,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct SubmitMilestone<'info> {
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
        space = 8 + VotingState::INIT_SPACE,
        seeds = [b"vote_state", &[VoteType::MilestoneApproval as u8][..], milestone.key().as_ref()],
        bump,
    )]
    pub voting_state: Account<'info, VotingState>,

    pub system_program: Program<'info, System>,
}
