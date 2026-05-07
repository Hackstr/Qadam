use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, VotingState, VoteType, VoteResolution, QadamConfig};
use crate::constants::MAX_EXTENSION_SECONDS;
use crate::errors::QadamError;
use crate::events::{ExtensionRequested, VoteOpened};

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

    // Capture keys before mutable borrows
    let campaign_key = campaign.key();
    let milestone_key = ctx.accounts.milestone.key();
    let voting_state_key = ctx.accounts.voting_state.key();
    let voting_deadline = now + 5 * 86400;

    // Update milestone status
    let milestone = &mut ctx.accounts.milestone;
    milestone.status = MilestoneStatus::ExtensionRequested;
    milestone.extension_deadline = new_deadline;
    // Store reason hash in evidence field (reuse)
    milestone.evidence_content_hash = reason_hash;
    milestone.voting_state = Some(voting_state_key);
    let milestone_index = milestone.index;

    // Initialize unified voting state
    let voting = &mut ctx.accounts.voting_state;
    voting.vote_type = VoteType::ExtensionGrant;
    voting.campaign = campaign_key;
    voting.context = milestone_key;
    // 5 days for extension votes — shorter than milestone votes
    voting.voting_deadline = voting_deadline;
    voting.approve_power = 0;
    voting.reject_power = 0;
    voting.votes_count = 0;
    voting.resolved = false;
    voting.resolution = VoteResolution::Unresolved;
    voting.resolved_at = 0;
    voting.bump = ctx.bumps.voting_state;

    emit!(VoteOpened {
        vote_type: 1, // ExtensionGrant
        campaign: campaign_key,
        context: milestone_key,
        voting_state: voting_state_key,
        voting_deadline,
    });

    emit!(ExtensionRequested {
        campaign: campaign_key,
        milestone_index,
        new_deadline,
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
        space = 8 + VotingState::INIT_SPACE,
        seeds = [b"vote_state", &[VoteType::ExtensionGrant as u8][..], milestone.key().as_ref()],
        bump,
    )]
    pub voting_state: Account<'info, VotingState>,

    pub system_program: Program<'info, System>,
}
