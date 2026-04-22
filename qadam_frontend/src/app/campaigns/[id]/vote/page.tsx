"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { getCampaign } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, Clock, Vote,
  ExternalLink, Eye, Timer, Users,
} from "lucide-react";
import Link from "next/link";
import { MilestoneComments } from "@/components/campaign/milestone-comments";

function useCountdown(deadline: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Voting ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  return timeLeft;
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { connected, publicKey } = useWallet();
  const { txStatus, voteOnExtension } = useQadamProgram();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
    refetchInterval: 10000, // live polling every 10s
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const campaign = campaignData?.data;
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
      </div>
    );
  }

  const votingMilestones = (campaign.milestones || []).filter(
    (m) => m.status === "voting_active" || m.status === "extension_requested"
  );

  // Also show recently submitted milestones (evidence submitted, waiting for votes)
  const submittedMilestones = (campaign.milestones || []).filter(
    (m) => m.status === "submitted"
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href={`/campaigns/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Vote className="h-5 w-5 text-purple-500" />
        <h1 className="text-2xl font-bold tracking-tight">Community Voting</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        {campaign.title} — your vote decides what happens next
      </p>

      {votingMilestones.length === 0 && submittedMilestones.length === 0 ? (
        <div className="text-center py-16 border border-black/[0.06] rounded-2xl">
          <Vote className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-medium text-muted-foreground">No active votes right now</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Votes open when creator submits milestone evidence
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active votes */}
          {votingMilestones.map((milestone) => (
            <VoteCard
              key={milestone.id}
              campaign={campaign}
              milestone={milestone}
              connected={connected}
              publicKey={publicKey}
              txStatus={txStatus}
              voteOnExtension={voteOnExtension}
            />
          ))}

          {/* Submitted — awaiting vote start */}
          {submittedMilestones.map((milestone) => (
            <Card key={milestone.id} className="border-blue-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <p className="font-medium text-sm">
                    Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
                  </p>
                  <Badge className="bg-blue-50 text-blue-700 text-xs">Evidence Submitted</Badge>
                </div>
                {milestone.evidence_text && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{milestone.evidence_text}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Voting will start soon.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VoteCard({
  campaign, milestone, connected, publicKey, txStatus, voteOnExtension,
}: {
  campaign: any;
  milestone: any;
  connected: boolean;
  publicKey: any;
  txStatus: string;
  voteOnExtension: any;
}) {
  const countdown = useCountdown(milestone.extension_deadline || milestone.deadline);
  const isVotingBusy = txStatus !== "idle" && txStatus !== "done" && txStatus !== "error";

  return (
    <Card className="overflow-hidden border-purple-100">
      {/* Header */}
      <div className="bg-purple-50/50 border-b border-purple-100 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">
              Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatSol(milestone.amount_lamports)} — {milestone.status === "voting_active" ? "Community is voting" : "Extension requested"}
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 gap-1">
            <Timer className="h-3 w-3" />
            {countdown}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Evidence submitted by creator */}
        {(milestone.evidence_text || (milestone.evidence_links && milestone.evidence_links.length > 0)) && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Eye className="h-3 w-3" /> Creator's evidence
            </p>
            {milestone.evidence_text && (
              <p className="text-sm leading-relaxed">{milestone.evidence_text}</p>
            )}
            {milestone.evidence_links && milestone.evidence_links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {milestone.evidence_links.map((link: string, i: number) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                    <ExternalLink className="h-3 w-3" /> {new URL(link).hostname}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acceptance criteria reminder */}
        {milestone.acceptance_criteria && (
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Acceptance criteria</p>
            <p className="text-xs text-muted-foreground">{milestone.acceptance_criteria}</p>
          </div>
        )}

        {/* Vote progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
            </span>
            <span className="text-red-500 font-medium flex items-center gap-1">
              Reject <XCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="h-3 bg-red-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${milestone.votes_approve_percent ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{milestone.votes_count ?? 0} vote(s) cast</span>
            <span>Quorum: 20% · {countdown}</span>
          </div>
        </div>

        {/* Vote buttons */}
        {!connected ? (
          <p className="text-center text-sm text-muted-foreground py-2">
            Connect your wallet to vote
          </p>
        ) : (
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={isVotingBusy}
              onClick={async () => {
                try {
                  await voteOnExtension(campaign.solana_pubkey, milestone.index, true);
                  const { syncVote } = await import("@/lib/api");
                  syncVote({
                    campaign_pubkey: campaign.solana_pubkey,
                    milestone_index: milestone.index,
                    wallet: publicKey!.toBase58(),
                    approve: true,
                    voting_power: 0,
                  }).catch(() => { /* sync best-effort */ });
                  toast.success("Vote cast — Approve");
                } catch (err: any) {
                  if (err?.message !== "cancelled") console.error(err);
                }
              }}
            >
              {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </Button>
            <Button
              className="flex-1 gap-2"
              variant="destructive"
              disabled={isVotingBusy}
              onClick={async () => {
                try {
                  await voteOnExtension(campaign.solana_pubkey, milestone.index, false);
                  const { syncVote } = await import("@/lib/api");
                  syncVote({
                    campaign_pubkey: campaign.solana_pubkey,
                    milestone_index: milestone.index,
                    wallet: publicKey!.toBase58(),
                    approve: false,
                    voting_power: 0,
                  }).catch(() => { /* sync best-effort */ });
                  toast.success("Vote cast — Reject");
                } catch (err: any) {
                  if (err?.message !== "cancelled") console.error(err);
                }
              }}
            >
              {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject
            </Button>
          </div>
        )}

        {/* Discussion */}
        <MilestoneComments milestoneId={milestone.id} />
      </CardContent>
    </Card>
  );
}
