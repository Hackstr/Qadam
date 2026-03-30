use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Campaign, MilestoneAccount, MilestoneStatus, AiDecision, CampaignStatus};
use crate::constants::QADAM_FEE_BPS;
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, bps_of, safe_add, safe_sub};
use crate::events::{MilestoneReleased, CampaignCompleted};

/// Shared release logic used by both release_milestone and admin_override_decision.
/// Calculates fee, deposit return, transfers SOL, updates state.
///
/// Returns (creator_amount, qadam_fee, deposit_return) for event emission.
pub fn execute_release<'info>(
    campaign: &mut Account<'info, Campaign>,
    milestone: &mut Account<'info, MilestoneAccount>,
    campaign_vault: &AccountInfo<'info>,
    creator: &AccountInfo<'info>,
    qadam_treasury: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    vault_bump: u8,
    ai_decision_hash: [u8; 32],
) -> Result<(u64, u64, u64)> {
    let milestone_amount = milestone.amount_lamports;

    // 1. Fee deducted FROM milestone amount (not additionally)
    let qadam_fee = bps_of(milestone_amount, QADAM_FEE_BPS as u64)?;
    let creator_amount = safe_sub(milestone_amount, qadam_fee)?;

    // 2. Proportional deposit return
    let deposit_return = mul_div(
        campaign.security_deposit_lamports,
        milestone_amount,
        campaign.total_goal_lamports,
    )?;

    // 3. Total to creator = (milestone - fee) + deposit_return
    let total_to_creator = safe_add(creator_amount, deposit_return)?;

    // 4. CPI transfers from vault PDA
    let campaign_key = campaign.key();
    let vault_seeds: &[&[u8]] = &[b"vault", campaign_key.as_ref(), &[vault_bump]];
    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];

    // Transfer to creator
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            system_program::Transfer {
                from: campaign_vault.to_account_info(),
                to: creator.to_account_info(),
            },
            signer_seeds,
        ),
        total_to_creator,
    )?;

    // Transfer fee to treasury
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            system_program::Transfer {
                from: campaign_vault.to_account_info(),
                to: qadam_treasury.to_account_info(),
            },
            signer_seeds,
        ),
        qadam_fee,
    )?;

    // 5. Update state
    campaign.security_deposit_remaining = safe_sub(
        campaign.security_deposit_remaining,
        deposit_return,
    )?;
    campaign.vault_balance = safe_sub(
        safe_sub(campaign.vault_balance, total_to_creator)?,
        qadam_fee,
    )?;

    milestone.status = MilestoneStatus::Approved;
    milestone.ai_decision = AiDecision::Approved;
    milestone.ai_decision_hash = ai_decision_hash;
    milestone.decided_at = Clock::get()?.unix_timestamp;

    campaign.milestones_approved = campaign.milestones_approved
        .checked_add(1)
        .ok_or(QadamError::MathOverflow)?;

    // 6. Check if campaign is complete
    if campaign.milestones_approved == campaign.milestones_count {
        campaign.status = CampaignStatus::Completed;
        emit!(CampaignCompleted {
            campaign: campaign.key(),
        });
    }

    emit!(MilestoneReleased {
        campaign: campaign.key(),
        milestone_index: milestone.index,
        creator_amount,
        qadam_fee,
        deposit_returned: deposit_return,
    });

    Ok((creator_amount, qadam_fee, deposit_return))
}
