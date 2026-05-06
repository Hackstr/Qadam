"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { getCampaign } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Vote, Shield, ChevronDown } from "lucide-react";
import Link from "next/link";
import { VoteCard } from "@/components/qadam/vote-card";
import { SOLANA_NETWORK } from "@/lib/constants";
import { useState } from "react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { connected, publicKey } = useWallet();
  const { txStatus, voteOnExtension } = useQadamProgram();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
    refetchInterval: 30000,
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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
      </div>
    );
  }

  const votingMilestones = (campaign.milestones || []).filter(
    (m) => m.status === "voting_active" || m.status === "extension_requested"
  );
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
        <h1 className="font-display text-2xl tracking-tight">Community Voting</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {campaign.title} — your vote decides what happens next
      </p>

      {/* Campaign context strip */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-black/[0.04]">
        <span>{formatSol(campaign.raised_lamports)} of {formatSol(campaign.goal_lamports)}</span>
        <span>{campaign.milestones_approved} of {campaign.milestones_count} milestones done</span>
        <span>{campaign.backers_count} backers</span>
      </div>

      {/* How voting works — collapsible */}
      <button
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Shield className="h-3 w-3" />
        How does voting work?
        <ChevronDown className={`h-3 w-3 transition-transform ${showHowItWorks ? "rotate-180" : ""}`} />
      </button>
      {showHowItWorks && (
        <div className="mb-6 p-4 border border-black/[0.06] rounded-xl text-sm text-muted-foreground space-y-1.5">
          <p>Approve = milestone funds released to the creator</p>
          <p>Reject = creator can revise and re-submit evidence</p>
          <p>Quorum: {Math.round((campaign.quorum_pct ?? 0.2) * 100)}% of voting power must participate</p>
          <p>Threshold: {Math.round((campaign.approval_threshold_pct ?? 0.5) * 100)}% approval needed to pass</p>
          <p>Votes are weighted by your backing amount (more SOL = more weight)</p>
        </div>
      )}

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

          {submittedMilestones.map((milestone) => (
            <Card key={milestone.id} className="border-black/[0.06]">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  <p className="font-medium text-sm">
                    Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
                  </p>
                  <Badge variant="secondary" className="text-xs">Evidence Submitted</Badge>
                </div>
                {milestone.evidence_text && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{milestone.evidence_text}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Voting will start soon.</p>
              </CardContent>
            </Card>
          ))}

          {/* Wallet connect if not connected */}
          {!connected && (
            <div className="text-center space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">Connect your wallet to cast your vote</p>
              <WalletMultiButton
                style={{
                  backgroundColor: "var(--foreground)",
                  height: "48px",
                  borderRadius: "9999px",
                  fontSize: "15px",
                  padding: "0 32px",
                  lineHeight: "48px",
                  width: "100%",
                  maxWidth: "320px",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              />
            </div>
          )}

          {SOLANA_NETWORK === "devnet" && (
            <p className="text-xs text-center text-amber-600 font-medium">
              Devnet — votes record on devnet only
            </p>
          )}
        </div>
      )}
    </div>
  );
}
