use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod helpers;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("4bummNmZFSwyRgwnfPHG6B9JPC8K6BigXgQYxoVKBcXj");

#[program]
pub mod qadam {
    use super::*;

    // ═══════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        admin_wallet: Pubkey,
        ai_agent_wallet: Pubkey,
        qadam_treasury: Pubkey,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, admin_wallet, ai_agent_wallet, qadam_treasury)
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        instructions::set_paused::handler(ctx, paused)
    }

    // ═══════════════════════════════════════════
    // CAMPAIGN LIFECYCLE
    // ═══════════════════════════════════════════

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String,
        nonce: u64,
        milestones_count: u8,
        total_goal_lamports: u64,
        tokens_per_lamport: u64,
    ) -> Result<()> {
        instructions::create_campaign::handler(ctx, title, nonce, milestones_count, total_goal_lamports, tokens_per_lamport)
    }

    pub fn add_milestone(
        ctx: Context<AddMilestone>,
        amount_lamports: u64,
        deadline: i64,
    ) -> Result<()> {
        instructions::add_milestone::handler(ctx, amount_lamports, deadline)
    }

    pub fn back_campaign(ctx: Context<BackCampaign>, amount_lamports: u64) -> Result<()> {
        instructions::back_campaign::handler(ctx, amount_lamports)
    }

    pub fn increase_backing(ctx: Context<IncreaseBacking>, additional_lamports: u64) -> Result<()> {
        instructions::increase_backing::handler(ctx, additional_lamports)
    }

    // ═══════════════════════════════════════════
    // MILESTONE FLOW
    // ═══════════════════════════════════════════

    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        milestone_index: u8,
        evidence_content_hash: [u8; 32],
    ) -> Result<()> {
        instructions::submit_milestone::handler(ctx, milestone_index, evidence_content_hash)
    }

    pub fn release_milestone(
        ctx: Context<ReleaseMilestone>,
        milestone_index: u8,
        ai_decision_hash: [u8; 32],
    ) -> Result<()> {
        instructions::release_milestone::handler(ctx, milestone_index, ai_decision_hash)
    }

    pub fn mark_under_human_review(
        ctx: Context<MarkUnderHumanReview>,
        milestone_index: u8,
        ai_decision_hash: [u8; 32],
    ) -> Result<()> {
        instructions::mark_under_human_review::handler(ctx, milestone_index, ai_decision_hash)
    }

    pub fn admin_override_decision(
        ctx: Context<AdminOverrideDecision>,
        milestone_index: u8,
        approved: bool,
        decision_hash: [u8; 32],
    ) -> Result<()> {
        instructions::admin_override_decision::handler(ctx, milestone_index, approved, decision_hash)
    }

    // ═══════════════════════════════════════════
    // TOKEN CLAIMING
    // ═══════════════════════════════════════════

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        instructions::claim_tokens::handler(ctx)
    }

    // ═══════════════════════════════════════════
    // GOVERNANCE
    // ═══════════════════════════════════════════

    pub fn request_extension(
        ctx: Context<RequestExtension>,
        milestone_index: u8,
        reason_hash: [u8; 32],
        new_deadline: i64,
    ) -> Result<()> {
        instructions::request_extension::handler(ctx, milestone_index, reason_hash, new_deadline)
    }

    pub fn vote_on_extension(
        ctx: Context<VoteOnExtension>,
        milestone_index: u8,
        approve: bool,
    ) -> Result<()> {
        instructions::vote_on_extension::handler(ctx, milestone_index, approve)
    }

    pub fn execute_extension_result(
        ctx: Context<ExecuteExtensionResult>,
        milestone_index: u8,
    ) -> Result<()> {
        instructions::execute_extension_result::handler(ctx, milestone_index)
    }

    // ═══════════════════════════════════════════
    // REFUND
    // ═══════════════════════════════════════════

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }

    // ═══════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════

    pub fn close_backer_position(ctx: Context<CloseBackerPosition>) -> Result<()> {
        instructions::close_backer_position::handler(ctx)
    }

    pub fn close_campaign(ctx: Context<CloseCampaign>) -> Result<()> {
        instructions::close_campaign::handler(ctx)
    }

    /// Creator cancels a campaign with no backers and reclaims deposit
    pub fn cancel_campaign(ctx: Context<CancelCampaign>) -> Result<()> {
        instructions::cancel_campaign::handler(ctx)
    }
}
