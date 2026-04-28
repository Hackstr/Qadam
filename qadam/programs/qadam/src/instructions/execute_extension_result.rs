use anchor_lang::prelude::*;
use crate::state::{Campaign, CampaignStatus, MilestoneAccount, MilestoneStatus, ExtensionVotingState, QadamConfig};
use crate::constants::GRACE_PERIOD_SECONDS;
use crate::errors::QadamError;
use crate::helpers::math::mul_div;
use crate::events::{ExtensionExecuted, CampaignRefunded};

pub fn handler(
    ctx: Context<ExecuteExtensionResult>,
    _milestone_index: u8,
) -> Result<()> {
    let voting = &mut ctx.accounts.voting_state;
    require!(!voting.executed, QadamError::AlreadyExecuted);

    let now = Clock::get()?.unix_timestamp;
    require!(now >= voting.voting_deadline, QadamError::VotingNotEnded);

    let campaign = &mut ctx.accounts.campaign;
    let milestone = &mut ctx.accounts.milestone;

    // Calculate quorum using per-campaign quorum_bps
    let quorum_threshold = mul_div(campaign.total_tokens_allocated, campaign.quorum_bps as u64, 10_000)?;
    let total_voted = voting.total_approve_power
        .checked_add(voting.total_reject_power)
        .ok_or(QadamError::MathOverflow)?;

    // Determine outcome using per-campaign approval_threshold_bps
    let extend = if total_voted < quorum_threshold {
        // No quorum → default: extend (benefit of doubt)
        true
    } else {
        // Quorum met → check approval threshold
        // approved if approve_power * 10000 >= total_voted * threshold_bps
        let approve_scaled = (voting.total_approve_power as u128)
            .checked_mul(10_000)
            .ok_or(QadamError::MathOverflow)?;
        let threshold_scaled = (total_voted as u128)
            .checked_mul(campaign.approval_threshold_bps as u128)
            .ok_or(QadamError::MathOverflow)?;
        approve_scaled >= threshold_scaled
    };

    if extend {
        // Extend milestone deadline
        milestone.deadline = voting.proposed_deadline;
        milestone.grace_deadline = voting.proposed_deadline + GRACE_PERIOD_SECONDS;
        milestone.status = MilestoneStatus::Extended;
    } else {
        // Refund — snapshot vault balance for proportional claims
        // Guard: must have backers, otherwise refund math divides by zero
        require!(campaign.raised_lamports > 0, QadamError::InvalidCampaignStatus);

        campaign.refund_snapshot_vault_balance = campaign.vault_balance;
        campaign.status = CampaignStatus::Refunded;
        milestone.status = MilestoneStatus::Failed;

        emit!(CampaignRefunded {
            campaign: campaign.key(),
            vault_balance_snapshot: campaign.refund_snapshot_vault_balance,
        });
    }

    voting.executed = true;

    emit!(ExtensionExecuted {
        campaign: campaign.key(),
        milestone_index: milestone.index,
        extended: extend,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct ExecuteExtensionResult<'info> {
    /// Anyone can execute after voting deadline
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
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
        mut,
        seeds = [b"voting", milestone.key().as_ref()],
        bump = voting_state.bump,
    )]
    pub voting_state: Account<'info, ExtensionVotingState>,
}
