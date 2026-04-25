"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneComments } from "@/components/campaign/milestone-comments";
import { useCountdown } from "@/hooks/use-countdown";
import { formatSol } from "@/lib/constants";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Loader2, Timer, Eye, ExternalLink,
} from "lucide-react";

export interface VoteCardProps {
  campaign: any;
  milestone: any;
  connected: boolean;
  publicKey: any;
  txStatus: string;
  voteOnExtension: (pubkey: string, index: number, approve: boolean) => Promise<any>;
}

export function VoteCard({
  campaign, milestone, connected, publicKey, txStatus, voteOnExtension,
}: VoteCardProps) {
  const countdown = useCountdown(milestone.extension_deadline || milestone.deadline);
  const isVotingBusy = txStatus !== "idle" && txStatus !== "done" && txStatus !== "error";

  const handleVote = async (approve: boolean) => {
    try {
      await voteOnExtension(campaign.solana_pubkey, milestone.index, approve);
      const { syncVote } = await import("@/lib/api");
      syncVote({
        campaign_pubkey: campaign.solana_pubkey,
        milestone_index: milestone.index,
        wallet: publicKey!.toBase58(),
        approve,
        voting_power: 0,
      }).catch(() => {});
      toast.success(`Vote cast — ${approve ? "Approve" : "Reject"}`);
    } catch (err: any) {
      if (err?.message !== "cancelled") console.error(err);
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
        {(milestone.evidence_text || (milestone.evidence_links && milestone.evidence_links.length > 0)) && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Eye className="h-3 w-3" /> Creator&apos;s evidence
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

        {milestone.acceptance_criteria && (
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Acceptance criteria</p>
            <p className="text-xs text-muted-foreground">{milestone.acceptance_criteria}</p>
          </div>
        )}

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

        {!connected ? (
          <p className="text-center text-sm text-muted-foreground py-2">
            Connect your wallet to vote
          </p>
        ) : (
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={isVotingBusy}
              onClick={() => handleVote(true)}
            >
              {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </Button>
            <Button
              className="flex-1 gap-2"
              variant="destructive"
              disabled={isVotingBusy}
              onClick={() => handleVote(false)}
            >
              {isVotingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject
            </Button>
          </div>
        )}

        <MilestoneComments milestoneId={milestone.id} />
      </CardContent>
    </Card>
  );
}
