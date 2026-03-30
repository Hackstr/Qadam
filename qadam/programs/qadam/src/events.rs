use anchor_lang::prelude::*;

#[event]
pub struct CampaignCreated {
    pub campaign: Pubkey,
    pub creator: Pubkey,
    pub goal_lamports: u64,
    pub milestones_count: u8,
    pub token_mint: Pubkey,
}

#[event]
pub struct CampaignActivated {
    pub campaign: Pubkey,
}

#[event]
pub struct CampaignBacked {
    pub campaign: Pubkey,
    pub backer: Pubkey,
    pub amount_lamports: u64,
    pub tier: u8,
    pub tokens_allocated: u64,
}

#[event]
pub struct MilestoneSubmitted {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub evidence_content_hash: [u8; 32],
}

#[event]
pub struct MilestoneReleased {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub creator_amount: u64,
    pub qadam_fee: u64,
    pub deposit_returned: u64,
}

#[event]
pub struct MilestoneUnderReview {
    pub campaign: Pubkey,
    pub milestone_index: u8,
}

#[event]
pub struct MilestoneRejected {
    pub campaign: Pubkey,
    pub milestone_index: u8,
}

#[event]
pub struct ExtensionRequested {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub new_deadline: i64,
    pub voting_deadline: i64,
}

#[event]
pub struct VoteCast {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub voter: Pubkey,
    pub approve: bool,
    pub voting_power: u64,
}

#[event]
pub struct ExtensionExecuted {
    pub campaign: Pubkey,
    pub milestone_index: u8,
    pub extended: bool,
}

#[event]
pub struct CampaignRefunded {
    pub campaign: Pubkey,
    pub vault_balance_snapshot: u64,
}

#[event]
pub struct RefundClaimed {
    pub campaign: Pubkey,
    pub backer: Pubkey,
    pub amount_lamports: u64,
}

#[event]
pub struct CampaignCompleted {
    pub campaign: Pubkey,
}
