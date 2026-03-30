use anchor_lang::prelude::*;
use crate::state::{Campaign, MilestoneAccount, BackerPosition, ExtensionVotingState, ExtensionVote, QadamConfig};
use crate::constants::VOTE_CAP_BPS;
use crate::errors::QadamError;
use crate::helpers::math::mul_div;
use crate::events::VoteCast;

pub fn handler(
    ctx: Context<VoteOnExtension>,
    _milestone_index: u8,
    approve: bool,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let campaign = &ctx.accounts.campaign;
    let position = &ctx.accounts.backer_position;
    let voting = &mut ctx.accounts.voting_state;

    let now = Clock::get()?.unix_timestamp;
    require!(now < voting.voting_deadline, QadamError::VotingEnded);

    // Voting power = tokens_allocated (from BackerPosition, NOT minted tokens)
    // Cap at 20% of total_tokens_allocated
    let raw_power = position.tokens_allocated;
    let max_power = mul_div(campaign.total_tokens_allocated, VOTE_CAP_BPS, 10_000)?;
    let voting_power = raw_power.min(max_power);

    require!(voting_power > 0, QadamError::NotABacker);

    // Record vote
    let vote = &mut ctx.accounts.extension_vote;
    vote.milestone = ctx.accounts.milestone.key();
    vote.voter = ctx.accounts.voter.key();
    vote.voting_power = voting_power;
    vote.vote_approve = approve;
    vote.voted_at = now;
    vote.bump = ctx.bumps.extension_vote;

    // Update aggregate
    if approve {
        voting.total_approve_power = voting.total_approve_power
            .checked_add(voting_power)
            .ok_or(QadamError::MathOverflow)?;
    } else {
        voting.total_reject_power = voting.total_reject_power
            .checked_add(voting_power)
            .ok_or(QadamError::MathOverflow)?;
    }

    emit!(VoteCast {
        campaign: campaign.key(),
        milestone_index: ctx.accounts.milestone.index,
        voter: ctx.accounts.voter.key(),
        approve,
        voting_power,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(milestone_index: u8)]
pub struct VoteOnExtension<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, QadamConfig>,

    #[account(
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(
        seeds = [b"milestone", campaign.key().as_ref(), &[milestone_index]],
        bump = milestone.bump,
        constraint = milestone.campaign == campaign.key() @ QadamError::InvalidMilestoneStatus,
    )]
    pub milestone: Account<'info, MilestoneAccount>,

    #[account(
        seeds = [b"backer", campaign.key().as_ref(), voter.key().as_ref()],
        bump = backer_position.bump,
        constraint = backer_position.backer == voter.key() @ QadamError::NotABacker,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    #[account(
        mut,
        seeds = [b"voting", milestone.key().as_ref()],
        bump = voting_state.bump,
    )]
    pub voting_state: Account<'info, ExtensionVotingState>,

    /// Vote PDA — prevents double voting
    #[account(
        init,
        payer = voter,
        space = 8 + ExtensionVote::INIT_SPACE,
        seeds = [b"vote", milestone.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub extension_vote: Account<'info, ExtensionVote>,

    pub system_program: Program<'info, System>,
}
