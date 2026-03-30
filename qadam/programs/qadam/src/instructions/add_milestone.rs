use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, AiDecision, QadamConfig};
use crate::constants::GRACE_PERIOD_SECONDS;
use crate::errors::QadamError;
use crate::helpers::math::safe_add;
use crate::events::CampaignActivated;

pub fn handler(
    ctx: Context<AddMilestone>,
    amount_lamports: u64,
    deadline: i64,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &mut ctx.accounts.campaign;
    require!(
        campaign.status == CampaignStatus::Draft,
        QadamError::InvalidCampaignStatus
    );
    require!(
        campaign.milestones_initialized < campaign.milestones_count,
        QadamError::TooManyMilestones
    );

    let now = Clock::get()?.unix_timestamp;
    require!(deadline > now, QadamError::DeadlineInPast);
    require!(amount_lamports > 0, QadamError::MilestoneAmountMismatch);

    let index = campaign.milestones_initialized;

    // Initialize milestone
    let milestone = &mut ctx.accounts.milestone;
    milestone.campaign = campaign.key();
    milestone.index = index;
    milestone.amount_lamports = amount_lamports;
    milestone.deadline = deadline;
    milestone.grace_deadline = deadline + GRACE_PERIOD_SECONDS;
    milestone.extension_deadline = 0;
    milestone.status = MilestoneStatus::Pending;
    milestone.evidence_content_hash = [0u8; 32];
    milestone.ai_decision = AiDecision::None;
    milestone.ai_decision_hash = [0u8; 32];
    milestone.submitted_at = 0;
    milestone.decided_at = 0;
    milestone.bump = ctx.bumps.milestone;

    // Store amount in campaign's array (for claim_tokens to use without remaining_accounts)
    campaign.milestone_amounts[index as usize] = amount_lamports;
    campaign.milestones_initialized = index + 1;

    // If all milestones added, validate total and activate
    if campaign.milestones_initialized == campaign.milestones_count {
        let mut sum: u64 = 0;
        for i in 0..campaign.milestones_count as usize {
            sum = safe_add(sum, campaign.milestone_amounts[i])?;
        }
        require!(
            sum == campaign.total_goal_lamports,
            QadamError::MilestoneAmountMismatch
        );

        campaign.status = CampaignStatus::Active;

        emit!(CampaignActivated {
            campaign: campaign.key(),
        });
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount_lamports: u64, deadline: i64)]
pub struct AddMilestone<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
        mut,
        seeds = [b"campaign", creator.key().as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
        has_one = creator @ QadamError::NotCreator,
    )]
    pub campaign: Account<'info, Campaign>,

    /// Milestone PDA — one per milestone per campaign
    #[account(
        init,
        payer = creator,
        space = 8 + MilestoneAccount::INIT_SPACE,
        seeds = [b"milestone", campaign.key().as_ref(), &[campaign.milestones_initialized]],
        bump,
    )]
    pub milestone: Account<'info, MilestoneAccount>,

    pub system_program: Program<'info, System>,
}
