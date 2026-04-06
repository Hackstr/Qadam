import type { Campaign, Milestone, BackerPosition, User, CampaignUpdate as CampaignUpdateType } from "@/types";

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
