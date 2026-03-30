// ═══════════════════════════════════════════
// Domain types matching backend schemas
// ═══════════════════════════════════════════

export interface Campaign {
  id: string;
  solana_pubkey: string;
  creator_wallet: string;
  title: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  pitch_video_url?: string;
  goal_lamports: number;
  raised_lamports: number;
  backers_count: number;
  token_mint_address?: string;
  status: CampaignStatus;
  milestones_count: number;
  milestones_approved: number;
  milestones?: Milestone[];
  inserted_at: string;
}

export type CampaignStatus = "draft" | "active" | "completed" | "refunded" | "paused";

export interface Milestone {
  id: string;
  index: number;
  title?: string;
  description?: string;
  acceptance_criteria?: string;
  amount_lamports: number;
  deadline: string;
  status: MilestoneStatus;
  evidence_text?: string;
  evidence_links?: string[];
  ai_decision?: string;
  ai_explanation?: string;
  submitted_at?: string;
  decided_at?: string;
}

export type MilestoneStatus =
  | "pending"
  | "grace_period"
  | "submitted"
  | "ai_processing"
  | "under_human_review"
  | "approved"
  | "rejected"
  | "extension_requested"
  | "voting_active"
  | "extended"
  | "failed";

export interface BackerPosition {
  campaign_id: string;
  campaign_title?: string;
  campaign_status?: CampaignStatus;
  wallet_address: string;
  amount_lamports: number;
  tokens_allocated: number;
  tokens_claimed: number;
  tier: 1 | 2 | 3;
  refund_claimed: boolean;
  backed_at?: string;
}

export interface ExtensionVote {
  voter_wallet: string;
  voting_power: number;
  vote_approve: boolean;
}
