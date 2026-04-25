"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { getCampaign } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Vote } from "lucide-react";
import Link from "next/link";
import { VoteCard } from "@/components/qadam/vote-card";

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

