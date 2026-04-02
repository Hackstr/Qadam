"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSol, TIER_LABELS } from "@/lib/constants";
import { Loader2, Wallet, TrendingUp, Gift, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { claimTokens, claimRefund, txStatus } = useQadamProgram();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    enabled: connected,
  });

  const positions = data?.data || [];
  const totalBacked = positions.reduce((sum, p) => sum + p.amount_lamports, 0);
  const totalTokens = positions.reduce((sum, p) => sum + p.tokens_allocated, 0);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Backer Portfolio</h1>
        <p className="text-muted-foreground">Connect your wallet to view your backed projects.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Portfolio</h1>
      <p className="text-sm text-muted-foreground mb-8">Your backed campaigns and token positions.</p>

      {/* Stats — clean minimal */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold tabular-nums">{formatSol(totalBacked)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Backed</p>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold tabular-nums">{totalTokens.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Tokens Allocated</p>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <p className="text-2xl font-bold tabular-nums">{positions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Campaigns</p>
        </div>
      </div>

      {/* Positions */}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : positions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No backed campaigns yet</p>
          <p className="text-sm mt-1">
            <Link href="/campaigns" className="text-amber-500 hover:underline">
              Discover campaigns
            </Link>{" "}
            to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos, idx) => {
            const tierInfo = TIER_LABELS[pos.tier as 1 | 2 | 3];
            const hasUnclaimedTokens = pos.tokens_claimed < pos.tokens_allocated;
            const canRefund = pos.campaign_status === "refunded" && !pos.refund_claimed;
            const needsVote = pos.campaign_status === "active"; // voting may be open

            return (
              <Card key={idx} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/campaigns/${pos.campaign_id}`} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pos.campaign_title || "Campaign"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {pos.campaign_status}
                        </Badge>
                        <span className={`text-xs ${tierInfo.color}`}>
                          {tierInfo.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatSol(pos.amount_lamports)}</p>
                      <p className="text-xs text-muted-foreground">
                        {pos.tokens_claimed.toLocaleString()} / {pos.tokens_allocated.toLocaleString()} tokens
                      </p>
                    </div>
                  </Link>

                  {/* Action buttons */}
                  {(hasUnclaimedTokens || canRefund || needsVote) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {hasUnclaimedTokens && pos.campaign_status !== "refunded" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                          onClick={(e) => {
                            e.preventDefault();
                            claimTokens(pos.campaign_id);
                          }}
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Claim Tokens
                        </Button>
                      )}
                      {needsVote && (
                        <Link href={`/campaigns/${pos.campaign_id}/vote`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Vote
                          </Button>
                        </Link>
                      )}
                      {canRefund && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                          onClick={(e) => {
                            e.preventDefault();
                            claimRefund(pos.campaign_id);
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Claim Refund
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
