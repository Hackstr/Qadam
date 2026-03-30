"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol, TIER_LABELS } from "@/lib/constants";
import { Loader2, Wallet, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
  const { connected } = useWallet();

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
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
      <p className="text-muted-foreground mb-8">Track your backed campaigns and token positions.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{formatSol(totalBacked)}</p>
              <p className="text-sm text-muted-foreground">Total Backed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Tokens Allocated</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
              {positions.length}
            </div>
            <div>
              <p className="text-2xl font-bold">{positions.length}</p>
              <p className="text-sm text-muted-foreground">Campaigns</p>
            </div>
          </CardContent>
        </Card>
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
            return (
              <Link key={idx} href={`/campaigns/${pos.campaign_id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
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
                        {pos.tokens_claimed.toLocaleString()} / {pos.tokens_allocated.toLocaleString()} tokens claimed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
