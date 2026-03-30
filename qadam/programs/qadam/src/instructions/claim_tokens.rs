use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::{Campaign, BackerPosition, QadamConfig};
use crate::errors::QadamError;
use crate::helpers::math::{mul_div, safe_add};

pub fn handler(ctx: Context<ClaimTokens>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let position = &mut ctx.accounts.backer_position;

    let approved = campaign.milestones_approved;
    let claimed_through = position.milestones_claimed_through;

    require!(approved > claimed_through, QadamError::NothingToClaim);

    // Calculate claimable tokens from milestone_amounts stored on campaign
    // Each milestone's share = tokens_allocated * milestone_amount / total_goal
    let mut claimable: u64 = 0;
    for i in claimed_through..approved {
        let milestone_amount = campaign.milestone_amounts[i as usize];
        let portion = mul_div(
            position.tokens_allocated,
            milestone_amount,
            campaign.total_goal_lamports,
        )?;
        claimable = safe_add(claimable, portion)?;
    }

    require!(claimable > 0, QadamError::NothingToClaim);

    // Mint tokens via CPI — Campaign PDA is mint authority
    let creator_key = campaign.creator;
    let nonce_bytes = campaign.nonce.to_le_bytes();
    let campaign_bump = campaign.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"campaign",
        creator_key.as_ref(),
        nonce_bytes.as_ref(),
        &[campaign_bump],
    ]];

    token_interface::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.backer_token_account.to_account_info(),
                authority: ctx.accounts.campaign.to_account_info(),
            },
            signer_seeds,
        ),
        claimable,
    )?;

    position.tokens_claimed = safe_add(position.tokens_claimed, claimable)?;
    position.milestones_claimed_through = approved;

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,

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
        mut,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump = backer_position.bump,
        has_one = backer @ QadamError::NotABacker,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    /// Token mint — authority is Campaign PDA
    #[account(
        mut,
        seeds = [b"mint", campaign.key().as_ref()],
        bump,
        constraint = token_mint.key() == campaign.token_mint @ QadamError::InvalidCampaignStatus,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,

    /// Backer's associated token account (created if needed)
    #[account(
        init_if_needed,
        payer = backer,
        associated_token::mint = token_mint,
        associated_token::authority = backer,
        associated_token::token_program = token_program,
    )]
    pub backer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
