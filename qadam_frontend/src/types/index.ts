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
  tokens_per_lamport?: number;
  creator_display_name?: string;
  creator_avatar_url?: string;
  creator_bio?: string;
  creator_location?: string;
  creator_socials?: Record<string, string>;
  status: CampaignStatus;
  milestones_count: number;
  milestones_approved: number;
  milestones?: Milestone[];
  // Foundation v1 — Story split
  problem?: string;
  solution?: string;
  why_now?: string;
  background?: string;
  risks?: string;
  // Foundation v1 — Team & Discovery
  team_members?: { name: string; role: string; avatar_url?: string; social_link?: string }[];
  tier_config?: { name: string; multiplier: number; max_spots: number | null }[];
  vote_period_days?: number;
  quorum_pct?: number;
  approval_threshold_pct?: number;
  funding_deadline?: string;
  days_to_funding_deadline?: number;
  location?: string;
  tags?: string[];
  slug?: string;
  launched_at?: string;
  funded_at?: string;
  faq?: { q: string; a: string }[];
  inserted_at: string;
}

export type CampaignStatus = "draft" | "active" | "completed" | "refunded" | "paused" | "cancelled";

export interface Milestone {
  id: string;
  index: number;
  title?: string;
  description?: string;
  acceptance_criteria?: string;
  acceptance_criteria_list?: string[];
  deliverables?: string;
  amount_lamports: number;
  deadline: string;
  status: MilestoneStatus;
  evidence_text?: string;
  evidence_links?: string[];
  ai_decision?: string;
  ai_explanation?: string;
  extension_deadline?: string;
  submitted_at?: string;
  decided_at?: string;
  released_at?: string;
  votes_count?: number;
  votes_approve?: number;
  votes_reject?: number;
  votes_total_power?: number;
  votes_approve_percent?: number;
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
  campaign_pubkey?: string;
  campaign_title?: string;
  campaign_status?: CampaignStatus;
  milestones_count?: number;
  milestones_approved?: number;
  wallet_address: string;
  amount_lamports: number;
  tokens_allocated: number;
  tokens_claimed: number;
  tier: 1 | 2 | 3;
  refund_claimed: boolean;
  has_active_vote?: boolean;
  backed_at?: string;
}

export interface CampaignUpdate {
  id: string;
  campaign_id: string;
  author_wallet: string;
  title: string;
  content: string;
  inserted_at: string;
}

export interface ExtensionVote {
  voter_wallet: string;
  voting_power: number;
  vote_approve: boolean;
}

export interface User {
  id: string;
  wallet_address: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  // Foundation v1 Creator Profile
  bio?: string;
  location?: string;
  socials?: Record<string, string>;
  previous_work?: { title: string; url: string; description?: string }[];
  // Notifications
  notify_milestone_approved: boolean;
  notify_milestone_rejected: boolean;
  notify_governance_vote: boolean;
  notify_refund_available: boolean;
  notify_campaign_updates: boolean;
  email_verified?: boolean;
  github_username?: string;
  github_verified: boolean;
}

export interface AdminDashboard {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_raised_lamports: number;
  total_backers: number;
  pending_reviews: number;
  success_rate: number;
  ai_accuracy: number;
  total_decisions: number;
  needs_attention: AdminAttentionItem[];
  recent_activity: AdminActivityItem[];
}

export interface AdminAttentionItem {
  type: "needs_review" | "overdue" | "stuck_in_ai";
  milestone_id: string;
  milestone_index: number;
  milestone_title?: string;
  campaign_id: string;
  campaign_title?: string;
  submitted_at?: string;
  deadline?: string;
}

export interface AdminActivityItem {
  id: string;
  from_state: string;
  to_state: string;
  metadata?: Record<string, any>;
  timestamp: string;
  campaign_title?: string;
  milestone_index?: number;
}
