"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneComments } from "@/components/campaign/milestone-comments";
import { useCountdown } from "@/hooks/use-countdown";
import { formatSol, SOLANA_NETWORK } from "@/lib/constants";
import { toast } from "sonner";
import type { Campaign, Milestone } from "@/types";
import type { PublicKey } from "@solana/web3.js";
import {
  CheckCircle2, XCircle, Loader2, Timer, Eye, ExternalLink,
} from "lucide-react";

export interface VoteCardProps {
  campaign: Pick<Campaign, "solana_pubkey" | "quorum_pct" | "approval_threshold_pct">;
  milestone: Milestone;
  connected: boolean;
  publicKey: PublicKey | null;
  txStatus: string;
  voteOnExtension: (pubkey: string, index: number, approve: boolean) => Promise<string>;
}

export function VoteCard({
  campaign, milestone, connected, publicKey, txStatus, voteOnExtension,
}: VoteCardProps) {
  const countdown = useCountdown(milestone.extension_deadline || milestone.deadline);
  const isVotingBusy = txStatus !== "idle" && txStatus !== "done" && txStatus !== "error";
  const quorumPct = Math.round((campaign.quorum_pct ?? 0.2) * 100);
  const isExtension = milestone.status === "extension_requested";

  const handleVote = async (approve: boolean) => {
    try {
      await voteOnExtension(campaign.solana_pubkey, milestone.index, approve);
      const { syncVote } = await import("@/lib/api");
      syncVote({
        campaign_pubkey: campaign.solana_pubkey,
        milestone_index: milestone.index,
        wallet: publicKey!.toBase58(),
        approve,
        voting_power: 0, // placeholder — Block 1 will track real weight
      }).catch(() => {});
      toast.success(`Vote cast — ${approve ? "Approve" : "Reject"}`, {
        description: "Your vote has been recorded on-chain.",
      });
    } catch (err: any) {
      if (err?.message !== "cancelled") {
        console.error(err);
        toast.error("Vote failed. Please try again.");
      }
    }
  };

  return (
    <Card className="overflow-hidden border-purple-100">
      <div className="bg-purple-50/50 border-b border-purple-100 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">
              Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatSol(milestone.amount_lamports)} — {isExtension ? "Creator requested an extension" : "Community is voting"}
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-700 gap-1">
            <Timer className="h-3 w-3" />
            {countdown}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {(milestone.evidence_text || (milestone.evidence_links && milestone.evidence_links.length > 0)) && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Eye className="h-3 w-3" /> Creator&apos;s evidence
            </p>
            {milestone.evidence_text && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{milestone.evidence_text}</p>
            )}
            {milestone.evidence_links && milestone.evidence_links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {milestone.evidence_links.map((link: string, i: number) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
                    <ExternalLink className="h-3 w-3" /> {(() => { try { return new URL(link).hostname; } catch { return link; } })()}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {milestone.acceptance_criteria && (
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Acceptance criteria</p>
            <p className="text-xs text-muted-foreground">{milestone.acceptance_criteria}</p>
          </div>
        )}

        {/* Vote progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {isExtension ? "Grant" : "Approve"}
            </span>
            <span className="text-red-400 font-medium flex items-center gap-1">
              {isExtension ? "Deny" : "Reject"} <XCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${milestone.votes_approve_percent ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{milestone.votes_count ?? 0} vote(s) cast</span>
            <span>Quorum: {quorumPct}% · {countdown}</span>
          </div>
        </div>

        {/* Vote buttons */}
        {connected && (
          <div className="space-y-2">
            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isVotingBusy}
                onClick={() => handleVote(true)}
              >
                {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isExtension ? "Grant Extension" : "Approve"}
              </Button>
              <Button
                className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                variant="outline"
                disabled={isVotingBusy}
                onClick={() => handleVote(false)}
              >
                {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {isExtension ? "Deny" : "Reject"}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Your wallet will ask you to confirm. Votes are final.
            </p>
          </div>
        )}

        <MilestoneComments milestoneId={milestone.id} />
      </CardContent>
    </Card>
  );
}
