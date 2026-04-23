"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSol, TIER_LABELS } from "@/lib/constants";
import {
  Loader2, Wallet, Gift, RotateCcw, Vote, CheckCircle2,
  TrendingUp, Coins, AlertTriangle, ArrowRight, ExternalLink,
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-1">Your Portfolio</h1>
      <p className="text-muted-foreground mb-8">Track your backed projects, vote on milestones, claim tokens.</p>

      {/* Stats — 4 colored cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-black/[0.06]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total backed</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatSol(totalBacked)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{positions.length} campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-green-600">{formatSol(activePositions.reduce((s, p) => s + p.amount_lamports, 0))}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{activePositions.length} campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Claimable</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-purple-600">{claimableTokens.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">tokens across campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.06]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Pending refunds</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-red-500">{pendingRefunds.length > 0 ? formatSol(pendingRefunds.reduce((s, p) => s + p.amount_lamports, 0)) : "0"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{pendingRefunds.length} campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Required */}
      {actions.length > 0 && (
        <Card className="mb-8 border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Action required ({actions.length})</p>
            </div>
            <div className="space-y-2">
              {actions.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 p-3">
                  <div className="flex items-center gap-2">
                    {a.type === "vote" ? <Vote className="h-4 w-4 text-purple-500" /> : a.type === "claim" ? <Gift className="h-4 w-4 text-green-500" /> : <RotateCcw className="h-4 w-4 text-red-400" />}
                    <span className="text-sm">{a.text}</span>
                  </div>
                  <Link href={a.href}>
                    <Button size="sm" className={`rounded-full text-xs gap-1 ${
                      a.type === "vote" ? "bg-purple-600 hover:bg-purple-700" :
                      a.type === "claim" ? "bg-green-600 hover:bg-green-700" :
                      "bg-red-500 hover:bg-red-600"
                    } text-white`}>
                      {a.type === "vote" ? "Cast vote" : a.type === "claim" ? "Claim" : "Refund"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            {positions.map((pos, idx) => {
              const tierInfo = TIER_LABELS[pos.tier as 1 | 2 | 3];
              const hasUnclaimedTokens = pos.tokens_claimed < pos.tokens_allocated;
              const canRefund = pos.campaign_status === "refunded" && !pos.refund_claimed;
              const needsVote = pos.has_active_vote === true;
              const msCount = pos.milestones_count || 0;
              const msApproved = pos.milestones_approved || 0;

              return (
                <Card key={idx} className="hover:shadow-sm transition-shadow border-black/[0.06]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/campaigns/${pos.campaign_id}`} className="hover:underline">
                          <h3 className="font-semibold">{pos.campaign_title || "Campaign"}</h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{pos.campaign_status}</Badge>
                          <span className={`text-xs ${tierInfo.color}`}>{tierInfo.name} tier</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{pos.tokens_claimed.toLocaleString()} / {pos.tokens_allocated.toLocaleString()} share</span>
                        </div>

                        {/* Milestone dots */}
                        {msCount > 0 && (
                          <div className="flex items-center gap-0 mt-3">
                            {Array.from({ length: msCount }).map((_, i) => {
                              const isDone = i < msApproved;
                              return (
                                <div key={i} className="flex items-center flex-1">
                                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isDone ? "bg-green-500" : "bg-gray-200"}`} />
                                  {i < msCount - 1 && (
                                    <div className={`flex-1 h-px ${isDone ? "bg-green-300" : "bg-gray-100"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold tabular-nums">{formatSol(pos.amount_lamports)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(hasUnclaimedTokens || canRefund || needsVote) && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                        {needsVote && (
                          <Link href={`/campaigns/${pos.campaign_id}/vote`}>
                            <Button size="sm" className="gap-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
                              <Vote className="h-3 w-3" /> Vote on milestone
                            </Button>
                          </Link>
                        )}
                        {hasUnclaimedTokens && pos.campaign_status !== "refunded" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-full text-xs"
                            disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                            onClick={(e) => {
                              e.preventDefault();
                              const pubkey = pos.campaign_pubkey || pos.campaign_id;
                              claimTokens(pubkey).then(() => {
                                import("@/lib/api").then(({ syncClaimTokens }) =>
                                  syncClaimTokens({
                                    campaign_pubkey: pubkey,
                                    wallet: pos.wallet_address,
                                    tokens_claimed: pos.tokens_allocated,
                                  }).catch(() => { /* sync best-effort */ })
                                );
                              }).catch(() => {});
                            }}
                          >
                            <Gift className="h-3 w-3" />
                            Claim Share
                          </Button>
                        )}
                        {canRefund && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5 rounded-full text-xs"
                            disabled={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                            onClick={(e) => {
                              e.preventDefault();
                              const pubkey = pos.campaign_pubkey || pos.campaign_id;
                              claimRefund(pubkey).then(() => {
                                import("@/lib/api").then(({ syncRefund }) =>
                                  syncRefund({
                                    campaign_pubkey: pubkey,
                                    wallet: pos.wallet_address,
                                  }).catch(() => { /* sync best-effort */ })
                                );
                              }).catch(() => {});
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Claim Refund
                          </Button>
                        )}
                        <Link href={`/campaigns/${pos.campaign_id}`}>
                          <Button size="sm" variant="ghost" className="gap-1 text-xs">
                            <ExternalLink className="h-3 w-3" /> View Campaign
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
