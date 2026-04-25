"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/lib/constants";
import { StatsGrid } from "@/components/qadam/stats-grid";
import { ActionRequiredBanner } from "@/components/qadam/action-required-banner";
import { PositionCard } from "@/components/qadam/position-card";
import {
  Loader2, Wallet, RotateCcw,
  TrendingUp, Coins, ArrowRight,
} from "lucide-react";
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
  const activePositions = positions.filter(p => p.campaign_status === "active");
  const claimableTokens = positions.reduce((sum, p) => sum + Math.max(0, p.tokens_allocated - p.tokens_claimed), 0);
  const pendingRefunds = positions.filter(p => p.campaign_status === "refunded" && !p.refund_claimed);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Portfolio</h1>
        <p className="text-muted-foreground">Connect your wallet to view your backed projects.</p>
      </div>
    );
  }

  // Compute actions
  const actions: { text: string; href: string; type: "vote" | "claim" | "refund"; campaignId: string }[] = [];
  positions.forEach((pos) => {
    if (pos.has_active_vote) actions.push({ text: `Vote on "${pos.campaign_title}" milestone`, href: `/campaigns/${pos.campaign_id}/vote`, type: "vote", campaignId: pos.campaign_id });
    if (pos.tokens_claimed < pos.tokens_allocated && pos.campaign_status !== "refunded") actions.push({ text: `Claim share from "${pos.campaign_title}"`, href: `/portfolio`, type: "claim", campaignId: pos.campaign_id });
    if (pos.campaign_status === "refunded" && !pos.refund_claimed) actions.push({ text: `Claim refund from "${pos.campaign_title}"`, href: `/portfolio`, type: "refund", campaignId: pos.campaign_id });
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-1">Your Portfolio</h1>
      <p className="text-muted-foreground mb-8">Track your backed projects, vote on milestones, claim tokens.</p>

      {/* Stats — 4 colored cards */}
      <StatsGrid
        className="mb-8"
        items={[
          { icon: Wallet, label: "Total backed", value: formatSol(totalBacked), sublabel: `${positions.length} campaigns` },
          { icon: TrendingUp, iconColor: "text-green-500", label: "Active", value: formatSol(activePositions.reduce((s, p) => s + p.amount_lamports, 0)), valueColor: "text-green-600", sublabel: `${activePositions.length} campaigns` },
          { icon: Coins, iconColor: "text-purple-500", label: "Claimable", value: claimableTokens.toLocaleString(), valueColor: "text-purple-600", sublabel: "tokens across campaigns" },
          { icon: RotateCcw, iconColor: "text-red-400", label: "Pending refunds", value: pendingRefunds.length > 0 ? formatSol(pendingRefunds.reduce((s, p) => s + p.amount_lamports, 0)) : "0", valueColor: "text-red-500", sublabel: `${pendingRefunds.length} campaigns` },
        ]}
      />

      {/* Action Required */}
      <ActionRequiredBanner actions={actions} className="mb-8" />

      {/* Positions */}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-10" />
      ) : positions.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No backed campaigns yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Discover projects, back with SOL, earn a share.
          </p>
          <Link href="/campaigns">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
              Explore Campaigns <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-4">Active positions</h2>
          <div className="space-y-3">
            {positions.map((pos, idx) => (
              <PositionCard
                key={idx}
                position={pos}
                txBusy={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                onClaimTokens={(pubkey, wallet, tokensAllocated) => {
                  claimTokens(pubkey).then(() => {
                    import("@/lib/api").then(({ syncClaimTokens }) =>
                      syncClaimTokens({ campaign_pubkey: pubkey, wallet, tokens_claimed: tokensAllocated }).catch(() => {})
                    );
                  }).catch(() => {});
                }}
                onClaimRefund={(pubkey, wallet) => {
                  claimRefund(pubkey).then(() => {
                    import("@/lib/api").then(({ syncRefund }) =>
                      syncRefund({ campaign_pubkey: pubkey, wallet }).catch(() => {})
                    );
                  }).catch(() => {});
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
