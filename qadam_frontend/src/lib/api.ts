import type { Campaign, Milestone, BackerPosition, User, CampaignUpdate as CampaignUpdateType, AdminDashboard } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("qadam_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export async function getCampaigns(params?: {
  status?: string;
  category?: string;
  sort?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return fetchApi<{ data: Campaign[] }>(`/campaigns${qs ? `?${qs}` : ""}`);
}

export async function getCampaign(id: string) {
  return fetchApi<{ data: Campaign }>(`/campaigns/${id}`);
}

export async function getCampaignBackers(id: string) {
  return fetchApi<{ data: BackerPosition[] }>(`/campaigns/${id}/backers`);
}

export async function getMilestones(campaignId: string) {
  return fetchApi<{ data: Milestone[] }>(`/campaigns/${campaignId}/milestones`);
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

export async function getNonce() {
  return fetchApi<{ message: string; nonce: string; issued_at: string }>("/auth/nonce");
}

export async function verifySignature(pubkey: string, signature: string, message: string) {
  return fetchApi<{ token: string; wallet: string }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ pubkey, signature, message }),
  });
}

// ═══════════════════════════════════════════
// AUTHENTICATED API
// ═══════════════════════════════════════════

export async function getMe() {
  return fetchApi<{ data: User }>("/me");
}

export async function updateMe(data: Partial<User>) {
  return fetchApi<{ data: User }>("/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getPortfolio() {
  return fetchApi<{ data: BackerPosition[] }>("/portfolio");
}

export async function submitEvidence(
  campaignId: string,
  milestoneIndex: number,
  evidence: {
    text: string;
    links: string[];
    evidence_hash: string;
  }
) {
  return fetchApi<{ data: Milestone }>(
    `/campaigns/${campaignId}/milestones/${milestoneIndex}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(evidence),
    }
  );
}

// ═══════════════════════════════════════════
// SYNC — bridge on-chain events to PostgreSQL
// ═══════════════════════════════════════════

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload/cover`, {
    method: "POST",
    headers: getAuthHeader(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function uploadCoverImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload/cover`, {
    method: "POST",
    headers: getAuthHeader(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function syncCampaignCreation(data: {
  solana_pubkey: string;
  creator_wallet: string;
  title: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  pitch_video_url?: string;
  goal_lamports: number;
  milestones_count: number;
  tokens_per_lamport: number;
  milestones: { index: number; title: string; description?: string; acceptance_criteria?: string; amount_lamports: number; deadline: string; grace_deadline: string }[];
}) {
  return fetchApi<{ data: { id: string; solana_pubkey: string } }>("/webhooks/sync-campaign", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function syncBacking(data: {
  campaign_pubkey: string;
  backer_wallet: string;
  amount_lamports: number;
  tier: number;
  tokens_allocated: number;
}) {
  return fetchApi<{ ok: boolean }>("/webhooks/sync-backing", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function syncClaimTokens(data: {
  campaign_pubkey: string; wallet: string; tokens_claimed: number;
}) {
  return fetchApi<{ ok: boolean }>("/webhooks/sync-claim-tokens", { method: "POST", body: JSON.stringify(data) });
}

export async function syncVote(data: {
  campaign_pubkey: string; milestone_index: number; wallet: string; approve: boolean; voting_power: number;
}) {
  return fetchApi<{ ok: boolean }>("/webhooks/sync-vote", { method: "POST", body: JSON.stringify(data) });
}

export async function syncRefund(data: { campaign_pubkey: string; wallet: string }) {
  return fetchApi<{ ok: boolean }>("/webhooks/sync-refund", { method: "POST", body: JSON.stringify(data) });
}

// ═══════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════

export async function triggerMilestoneVerification(campaignId: string, milestoneIndex: number) {
  return fetchApi<{ ok: boolean; milestone_id: string }>("/webhooks/milestone-submitted", {
    method: "POST",
    body: JSON.stringify({ campaign_id: campaignId, milestone_index: milestoneIndex }),
  });
}

// ═══════════════════════════════════════════
// CAMPAIGN UPDATES
// ═══════════════════════════════════════════

export async function getCampaignUpdates(campaignId: string) {
  return fetchApi<{ data: CampaignUpdateType[] }>(`/campaigns/${campaignId}/updates`);
}

export async function postCampaignUpdate(
  campaignId: string,
  update: { title: string; content: string }
) {
  return fetchApi<{ data: CampaignUpdateType }>(`/campaigns/${campaignId}/updates`, {
    method: "POST",
    body: JSON.stringify(update),
  });
}

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message?: string;
  campaign_id?: string;
  read: boolean;
  inserted_at: string;
}

export async function getNotifications() {
  return fetchApi<{ data: NotificationItem[]; unread_count: number }>("/notifications");
}

export async function markNotificationsRead() {
  return fetchApi<{ ok: boolean }>("/notifications/mark-read", { method: "POST" });
}

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════

interface AnalyticsSummary {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_raised_lamports: number;
  total_backers: number;
  success_rate: number;
}

export async function getAnalyticsSummary() {
  return fetchApi<{ data: AnalyticsSummary }>("/analytics/summary");
}

// ═══════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════

export async function getReviewQueue() {
  return fetchApi<{ data: Milestone[] }>("/admin/review-queue");
}

export async function decideMilestone(id: string, approved: boolean) {
  return fetchApi<{ data: { id: string; status: string } }>(`/admin/milestones/${id}/decide`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}

export async function getAdminDashboard() {
  return fetchApi<{ data: AdminDashboard }>("/admin/dashboard");
}

export async function pauseCampaign(id: string) {
  return fetchApi<{ data: { id: string; status: string } }>(`/admin/campaigns/${id}/pause`, { method: "POST" });
}

export async function resumeCampaign(id: string) {
  return fetchApi<{ data: { id: string; status: string } }>(`/admin/campaigns/${id}/resume`, { method: "POST" });
}

export async function toggleFeatured(id: string, featured: boolean) {
  return fetchApi<{ data: { id: string; featured: boolean } }>(`/admin/campaigns/${id}/feature`, {
    method: "POST",
    body: JSON.stringify({ featured }),
  });
}

export async function getAdminCampaigns(filters?: { status?: string; category?: string; search?: string; sort?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.sort) params.set("sort", filters.sort);
  const qs = params.toString();
  return fetchApi<{ data: Campaign[] }>(`/admin/campaigns${qs ? `?${qs}` : ""}`);
}

export async function getAdminCampaignDetail(id: string) {
  return fetchApi<{ data: any }>(`/admin/campaigns/${id}/detail`);
}

export async function getAdminMilestones(filters?: { status?: string; ai_decision?: string; campaign_id?: string; preset?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.ai_decision) params.set("ai_decision", filters.ai_decision);
  if (filters?.campaign_id) params.set("campaign_id", filters.campaign_id);
  if (filters?.preset) params.set("preset", filters.preset);
  const qs = params.toString();
  return fetchApi<{ data: any[] }>(`/admin/milestones${qs ? `?${qs}` : ""}`);
}

export async function getAdminMilestoneDetail(id: string) {
  return fetchApi<{ data: any }>(`/admin/milestones/${id}/detail`);
}

export async function getAdminAuditLog(filters?: { campaign_id?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.campaign_id) params.set("campaign_id", filters.campaign_id);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return fetchApi<{ data: any[] }>(`/admin/audit${qs ? `?${qs}` : ""}`);
}

export async function getAdminAiStats() {
  return fetchApi<{ data: any }>("/admin/ai/stats");
}

export async function getAdminUsers(filters?: { search?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return fetchApi<{ data: any[] }>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export async function getAdminUserDetail(wallet: string) {
  return fetchApi<{ data: any }>(`/admin/users/${wallet}`);
}

export async function getAdminGovernance() {
  return fetchApi<{ data: { active: any[]; history: any[] } }>("/admin/governance");
}
