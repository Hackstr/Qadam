"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";

interface Nudge {
  id: string;
  campaign_id: string;
  title: string;
  body: string;
  primary_cta_label?: string;
  primary_cta_action?: string;
}

async function fetchNudges(campaignId?: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("qadam_token") : null;
  if (!token) return { data: [] };
  const url = campaignId
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/ai/nudges?campaign_id=${campaignId}`
    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/ai/nudges`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { data: [] };
  return res.json();
}

async function dismissNudge(id: string) {
  const token = localStorage.getItem("qadam_token");
  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/ai/nudges/${id}/dismiss`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

export function DailyNudge({ campaignId }: { campaignId?: string }) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["nudges", campaignId],
    queryFn: () => fetchNudges(campaignId),
    staleTime: 60_000,
    retry: false,
  });

  const dismiss = useMutation({
    mutationFn: dismissNudge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nudges"] }),
  });

  const nudges: Nudge[] = data?.data || [];
  if (nudges.length === 0) return null;
  const nudge = nudges[0];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Today&apos;s Focus · AI Companion</p>
        </div>
        <button
          onClick={() => dismiss.mutate(nudge.id)}
          className="text-amber-400 hover:text-amber-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="font-display text-xl tracking-tight text-amber-900 mb-1">{nudge.title}</h3>
      <p className="text-sm text-amber-800 leading-relaxed mb-4">{nudge.body}</p>
      <div className="flex items-center gap-3">
        {nudge.primary_cta_action && (
          <Link href={nudge.primary_cta_action}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2" size="sm">
              {nudge.primary_cta_label || "Take action"}
            </Button>
          </Link>
        )}
        <button
          onClick={() => dismiss.mutate(nudge.id)}
          className="text-xs text-amber-600 hover:underline"
        >
          Not today
        </button>
      </div>
    </div>
  );
}
