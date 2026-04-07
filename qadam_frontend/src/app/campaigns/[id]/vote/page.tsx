"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { getCampaign } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { connected, publicKey } = useWallet();
  const { txStatus, voteOnExtension } = useQadamProgram();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
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

  // Find milestones in voting state
  const votingMilestones = (campaign.milestones || []).filter(
    (m) => m.status === "voting_active" || m.status === "extension_requested"
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

      <h1 className="text-2xl font-bold tracking-tight mb-1">Governance Votes</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {campaign.title} — vote on milestone extensions or refunds
      </p>

      {votingMilestones.length === 0 ? (
        <div className="text-center py-16 border border-black/[0.06] rounded-2xl">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No active votes right now</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Votes open when a creator requests a milestone extension
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {votingMilestones.map((milestone) => (
            <Card key={milestone.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-amber-50 border-b border-amber-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Creator requested an extension. Your vote matters.
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Vote results so far (placeholder — real data from API) */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600 font-medium">Extend</span>
                    <span className="text-red-500 font-medium">Refund</span>
                  </div>
                  <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Voting ends {new Date(milestone.deadline).toLocaleDateString()}
                  </p>
                </div>

                {/* Vote buttons */}
                {!connected ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Connect wallet to vote
                  </p>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
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
                          }).catch(() => {});
                        } catch (err: any) {
                          if (err?.message !== "cancelled") console.error(err);
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Extend Deadline
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      variant="destructive"
                      disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
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
                          }).catch(() => {});
                        } catch (err: any) {
                          if (err?.message !== "cancelled") console.error(err);
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Request Refund
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
