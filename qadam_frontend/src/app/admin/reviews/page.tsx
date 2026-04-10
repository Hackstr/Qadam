"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviewQueue, decideMilestone } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Check, X, ClipboardCheck, Star, Clock,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function ReputationBar({ score }: { score: number }) {
  const filled = Math.round(score / 10);
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="font-medium tabular-nums">{score}/100</span>
      <span className="text-amber-500">
        {Array.from({ length: 10 }, (_, i) => i < filled ? "\u25CF" : "\u25CB").join("")}
      </span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: getReviewQueue,
    refetchInterval: 15000,
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      decideMilestone(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      toast.success("Decision submitted");
    },
  });

  const milestones: any[] = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Review Queue</h1>
        {milestones.length > 0 && (
          <Badge className="bg-amber-500 text-white">{milestones.length}</Badge>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p>No milestones pending review</p>
          <p className="text-xs mt-1">Items appear here when AI decision is PARTIAL.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {milestones.map((m) => (
            <ReviewCard
              key={m.id}
              milestone={m}
              onDecide={(approved) => decideMutation.mutate({ id: m.id, approved })}
              isPending={decideMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  milestone: m,
  onDecide,
  isPending,
}: {
  milestone: any;
  onDecide: (approved: boolean) => void;
  isPending: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const timeSinceSubmit = m.submitted_at
    ? formatTimeAgo(new Date(m.submitted_at))
    : "unknown";

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 bg-purple-50/50 border-b border-purple-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/admin/campaigns/${m.campaign_id}`} className="hover:underline">
              <CardTitle className="text-base">{m.campaign_title}</CardTitle>
            </Link>
            <p className="text-sm text-muted-foreground mt-0.5">
              Milestone {(m.index ?? 0) + 1}: {m.title || "Untitled"}
              {m.amount_lamports ? ` — ${formatSol(m.amount_lamports)}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            <Clock className="h-3 w-3 mr-1" /> {timeSinceSubmit}
          </Badge>
        </div>

        {/* Creator info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>
            Creator: <span className="font-mono">{m.creator_wallet?.slice(0, 6)}...{m.creator_wallet?.slice(-4)}</span>
            {m.creator_display_name && ` (${m.creator_display_name})`}
          </span>
          {m.creator_reputation && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" />
              <ReputationBar score={m.creator_reputation.score} />
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Acceptance Criteria */}
        {m.acceptance_criteria && (
          <div>
            <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Acceptance Criteria</p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
              {m.acceptance_criteria}
            </div>
          </div>
        )}

        {/* Evidence */}
        <div>
          <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Evidence Submitted</p>
          {m.evidence_text ? (
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{m.evidence_text}</div>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence text.</p>
          )}
        </div>

        {/* Links */}
        {m.evidence_links && m.evidence_links.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Links</p>
            <ul className="space-y-1">
              {m.evidence_links.map((link: string, i: number) => (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 break-all">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" /> {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Assessment */}
        {m.ai_explanation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Assessment</p>
              <Badge variant="outline" className="text-[10px]">{m.ai_decision || "PARTIAL"}</Badge>
            </div>
            <p className="text-sm">{m.ai_explanation}</p>
          </div>
        )}

        {/* State History — collapsible */}
        {m.transitions && m.transitions.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              State History ({m.transitions.length})
            </button>
            {showHistory && (
              <div className="mt-2 space-y-1">
                {m.transitions.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t.from_state} → {t.to_state}
                    </Badge>
                    <span>{new Date(t.timestamp).toLocaleString()}</span>
                    {t.metadata?.reason && <span className="text-muted-foreground/60">({t.metadata.reason})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Admin Notes (optional)</p>
          <Textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add a note about your decision..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t">
          <Button
            onClick={() => onDecide(true)}
            disabled={isPending}
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button
            onClick={() => onDecide(false)}
            disabled={isPending}
            size="sm"
            variant="destructive"
            className="gap-2"
          >
            <X className="h-4 w-4" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
