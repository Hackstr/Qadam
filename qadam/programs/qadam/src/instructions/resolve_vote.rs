use anchor_lang::prelude::*;
use crate::state::{Campaign, MilestoneAccount, MilestoneStatus, VotingState, VoteType, VoteResolution, QadamConfig};
use crate::constants::GRACE_PERIOD_SECONDS;
use crate::errors::QadamError;
use crate::events::{VoteResolved, MilestoneRejected, ExtensionDenied};
use crate::helpers::release::execute_release;

pub fn handler(
    ctx: Context<ResolveVote>,
    vote_type_param: u8,
) -> Result<()> {
    require!(!ctx.accounts.config.paused, QadamError::ProgramPaused);

    // Parse and validate vote type (0 = MilestoneApproval, 1 = ExtensionGrant, 2 = Refund)
    let parsed_type = match vote_type_param {
        0 => VoteType::MilestoneApproval,
        1 => VoteType::ExtensionGrant,
        2 => VoteType::Refund,
        _ => return Err(QadamError::VoteTypeMismatch.into()),
    };

    let now = Clock::get()?.unix_timestamp;

    // Capture keys and voting data before mutable borrows
    let voting_state_key = ctx.accounts.voting_state.key();
    let campaign_key = ctx.accounts.campaign.key();
    let milestone_index = ctx.accounts.milestone.index;

    // Read voting state immutably first to compute resolution
    let approve_power = ctx.accounts.voting_state.approve_power;
    let reject_power = ctx.accounts.voting_state.reject_power;
    let votes_count = ctx.accounts.voting_state.votes_count;
    let voting_deadline = ctx.accounts.voting_state.voting_deadline;
    let is_resolved = ctx.accounts.voting_state.resolved;

    require!(ctx.accounts.voting_state.vote_type == parsed_type, QadamError::VoteTypeMismatch);
    require!(now >= voting_deadline, QadamError::VotingNotEnded);
    require!(!is_resolved, QadamError::VoteAlreadyResolved);

    // Compute resolution:
    // - If no votes cast -> APPROVED (apathy = approval)
    // - Otherwise: approved if approve_power * 10000 / cast_power >= threshold
    let cast_power = approve_power
        .checked_add(reject_power)
        .ok_or(QadamError::MathOverflow)?;

    let approval_threshold_bps = ctx.accounts.campaign.approval_threshold_bps;
    let quorum_bps = ctx.accounts.campaign.quorum_bps;
    let total_tokens_allocated = ctx.accounts.campaign.total_tokens_allocated;

    // Quorum check: cast_power / total_tokens_allocated >= quorum_bps / 10000
    // Rearranged to avoid division: cast_power * 10000 >= quorum_bps * total_tokens_allocated
    let quorum_met = if total_tokens_allocated == 0 || cast_power == 0 {
        // No backers or no votes — apathy = approval (skip quorum)
        true
    } else {
        let cast_bps = (cast_power as u128)
            .checked_mul(10_000)
            .ok_or(QadamError::MathOverflow)?;
        let quorum_threshold = (quorum_bps as u128)
            .checked_mul(total_tokens_allocated as u128)
            .ok_or(QadamError::MathOverflow)?;
        cast_bps >= quorum_threshold
    };

    // If quorum not met and votes were cast, the vote is invalid
    // Quorum failure with zero votes = apathy = approval (handled above)
    let approved = if !quorum_met {
        // Quorum failed — milestone not approved, falls through to deadline/grace path
        false
    } else if cast_power == 0 {
        // No votes cast at all — apathy = approval
        true
    } else {
        // Quorum met — check approval threshold
        let approve_bps = (approve_power as u128)
            .checked_mul(10_000)
            .ok_or(QadamError::MathOverflow)?
            .checked_div(cast_power as u128)
            .ok_or(QadamError::MathOverflow)? as u64;
        approve_bps >= approval_threshold_bps as u64
    };

    let resolution = if approved {
        VoteResolution::Approved
    } else {
        VoteResolution::Rejected
    };

    // Now take mutable borrows
    let voting = &mut ctx.accounts.voting_state;
    voting.resolved = true;
    voting.resolved_at = now;
    voting.resolution = resolution;

    let campaign = &mut ctx.accounts.campaign;
    let milestone = &mut ctx.accounts.milestone;

    // Branch on vote type for side effects
    match parsed_type {
        VoteType::MilestoneApproval => {
            if approved {
                // Execute release — requires vault, creator, treasury accounts
                let campaign_vault = ctx.accounts.campaign_vault
                    .as_ref()
                    .ok_or(QadamError::InvalidMilestoneStatus)?;
                let creator_account = ctx.accounts.creator_account
                    .as_ref()
                    .ok_or(QadamError::InvalidMilestoneStatus)?;
                let qadam_treasury = ctx.accounts.qadam_treasury
                    .as_ref()
                    .ok_or(QadamError::InvalidMilestoneStatus)?;

                // Derive vault bump for signing
                let (_, vault_bump) = Pubkey::find_program_address(
                    &[b"vault", campaign_key.as_ref()],
                    ctx.program_id,
                );

                execute_release(
                    campaign,
                    milestone,
                    &campaign_vault.to_account_info(),
                    &creator_account.to_account_info(),
                    &qadam_treasury.to_account_info(),
                    &ctx.accounts.system_program.to_account_info(),
                    vault_bump,
                )?;
            } else {
                milestone.status = MilestoneStatus::Rejected;
                milestone.decided_at = now;
                emit!(MilestoneRejected {
                    campaign: campaign_key,
                    milestone_index,
                });
            }
        }
        VoteType::ExtensionGrant => {
            if approved {
                milestone.deadline = milestone.extension_deadline;
                milestone.grace_deadline = milestone.extension_deadline + GRACE_PERIOD_SECONDS;
                milestone.status = MilestoneStatus::Extended;
                milestone.decided_at = now;
            } else {
                milestone.status = MilestoneStatus::Pending;
                milestone.decided_at = now;
                emit!(ExtensionDenied {
                    campaign: campaign_key,
                    milestone_index,
                });
            }
        }
        VoteType::Refund => {
            // Pass A: resolve and emit event, but do not touch campaign/milestone state.
            // Block 3 will add refund distribution logic here.
        }
    }

    emit!(VoteResolved {
        vote_type: vote_type_param,
        voting_state: voting_state_key,
        decision: if approved { 1 } else { 2 },
        approve_power,
        reject_power,
        votes_count,
    });

    Ok(())
}

/// ResolveVote accounts struct.
///
/// Design choice: campaign_vault, creator_account, and qadam_treasury are declared as
/// Option<UncheckedAccount> because they are only required for MilestoneApproval votes
/// (where release executes). For ExtensionGrant and Refund votes, callers may pass
/// None for these accounts. The handler validates their presence when needed.
#[derive(Accounts)]
#[instruction(vote_type_param: u8)]
pub struct ResolveVote<'info> {
    /// Anyone can call resolve — no admin or creator requirement
    #[account(mut)]
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
        seeds = [b"milestone", campaign.key().as_ref(), &[milestone.index]],
        bump = milestone.bump,
        constraint = milestone.campaign == campaign.key() @ QadamError::InvalidMilestoneStatus,
    )]
    pub milestone: Account<'info, MilestoneAccount>,

    #[account(
        mut,
        seeds = [b"vote_state", &[vote_type_param][..], milestone.key().as_ref()],
        bump = voting_state.bump,
        constraint = voting_state.context == milestone.key() @ QadamError::VoteTypeMismatch,
    )]
    pub voting_state: Account<'info, VotingState>,

    /// Campaign vault — required for MilestoneApproval release, optional otherwise
    /// CHECK: Validated by seeds in execute_release via PDA derivation
    #[account(mut)]
    pub campaign_vault: Option<UncheckedAccount<'info>>,

    /// Creator wallet — required for MilestoneApproval release, optional otherwise
    /// CHECK: Must match campaign.creator; validated in execute_release
    #[account(mut)]
    pub creator_account: Option<UncheckedAccount<'info>>,

    /// Qadam treasury — required for MilestoneApproval release, optional otherwise
    /// CHECK: Must match config.qadam_treasury; validated in execute_release
    #[account(mut)]
    pub qadam_treasury: Option<UncheckedAccount<'info>>,

    pub system_program: Program<'info, System>,
}
