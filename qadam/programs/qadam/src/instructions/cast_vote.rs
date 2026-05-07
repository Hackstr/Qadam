use anchor_lang::prelude::*;
use crate::state::{Campaign, MilestoneAccount, BackerPosition, VotingState, Vote, VoteType, QadamConfig};
use crate::errors::QadamError;
use crate::events::VoteCast;

pub fn handler(
    ctx: Context<CastVote>,
    vote_type_param: u8,
    approve: bool,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    let voting = &mut ctx.accounts.voting_state;
    let position = &ctx.accounts.backer_position;

    // Type discriminator must match what we passed in (0 = MilestoneApproval, 1 = ExtensionGrant, 2 = Refund)
    let parsed_type = match vote_type_param {
        0 => VoteType::MilestoneApproval,
        1 => VoteType::ExtensionGrant,
        2 => VoteType::Refund,
        _ => return Err(QadamError::VoteTypeMismatch.into()),
    };
    require!(voting.vote_type == parsed_type, QadamError::VoteTypeMismatch);

    let now = Clock::get()?.unix_timestamp;
    require!(!voting.resolved, QadamError::VoteAlreadyResolved);
    require!(now < voting.voting_deadline, QadamError::VotingEnded);

    // Voter must be a backer of this campaign
    let voting_power = position.tokens_allocated;
    require!(voting_power > 0, QadamError::NotABacker);

    // Initialize the Vote PDA
    let vote = &mut ctx.accounts.vote;
    vote.voting_state = voting.key();
    vote.voter = ctx.accounts.voter.key();
    vote.voting_power = voting_power;
    vote.approve = approve;
    vote.voted_at = now;
    vote.bump = ctx.bumps.vote;

    // Update aggregate
    if approve {
        voting.approve_power = voting.approve_power
            .checked_add(voting_power)
            .ok_or(QadamError::MathOverflow)?;
    } else {
        voting.reject_power = voting.reject_power
            .checked_add(voting_power)
            .ok_or(QadamError::MathOverflow)?;
    }
    voting.votes_count = voting.votes_count
        .checked_add(1)
        .ok_or(QadamError::MathOverflow)?;

    emit!(VoteCast {
        vote_type: vote_type_param,
        voting_state: voting.key(),
        voter: ctx.accounts.voter.key(),
        approve,
        voting_power,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(vote_type_param: u8)]
pub struct CastVote<'info> {
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

    /// The context account this vote is for (currently always a milestone).
    #[account(
        seeds = [b"milestone", campaign.key().as_ref(), &[milestone.index]],
        bump = milestone.bump,
        constraint = milestone.campaign == campaign.key() @ QadamError::InvalidMilestoneStatus,
    )]
    pub milestone: Account<'info, MilestoneAccount>,

    /// Backer position proves the voter has skin in this campaign
    #[account(
        seeds = [b"backer", campaign.key().as_ref(), voter.key().as_ref()],
        bump = backer_position.bump,
        constraint = backer_position.backer == voter.key() @ QadamError::NotABacker,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    /// The voting state account — must already exist (opened by submit_milestone or request_extension)
    #[account(
        mut,
        seeds = [b"vote_state", &[vote_type_param][..], milestone.key().as_ref()],
        bump = voting_state.bump,
        constraint = voting_state.context == milestone.key() @ QadamError::VoteTypeMismatch,
    )]
    pub voting_state: Account<'info, VotingState>,

    /// Vote PDA — collision prevents double voting
    #[account(
        init,
        payer = voter,
        space = 8 + Vote::INIT_SPACE,
        seeds = [b"vote", voting_state.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote: Account<'info, Vote>,

    pub system_program: Program<'info, System>,
}
