"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignBackers } from "@/lib/api";
import { formatSol, formatPercent } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Loader2, Users, Wallet, TrendingUp,
  CheckCircle2, BarChart2,
} from "lucide-react";
import Link from "next/link";

export default function CampaignAnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const { data: backersData } = useQuery({
    queryKey: ["campaign-backers", id],
    queryFn: () => getCampaignBackers(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const c = campaignData?.data;
  const backers = backersData?.data || [];
  if (!c) return <p className="text-center text-muted-foreground py-20">Campaign not found.</p>;

  const progress = formatPercent(c.raised_lamports, c.goal_lamports);
  const avgBacking = backers.length > 0 ? c.raised_lamports / backers.length : 0;
  const genesisBakers = backers.filter((b: any) => b.tier === 1).length;
  const earlyBackers = backers.filter((b: any) => b.tier === 2).length;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Campaign Analytics</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">{c.title}</p>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-4 text-center">
          <Wallet className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{formatSol(c.raised_lamports)}</p>
          <p className="text-xs text-muted-foreground">Raised</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{progress}%</p>
          <p className="text-xs text-muted-foreground">Funded</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{c.backers_count}</p>
          <p className="text-xs text-muted-foreground">Backers</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle2 className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold tabular-nums">{c.milestones_approved}/{c.milestones_count}</p>
          <p className="text-xs text-muted-foreground">Milestones</p>
        </CardContent></Card>
      </div>

      {/* Funding breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Funding Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium">{formatSol(c.goal_lamports)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average backing</span>
                <span className="font-medium">{formatSol(avgBacking)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (2.5%)</span>
                <span className="font-medium">{formatSol(Math.floor(c.raised_lamports * 0.025))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">Backer Tiers</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Genesis (1.0x)</span>
                </div>
                <span className="font-semibold tabular-nums">{genesisBakers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Early (0.67x)</span>
                </div>
                <span className="font-semibold tabular-nums">{earlyBackers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Standard (0.5x)</span>
                </div>
                <span className="font-semibold tabular-nums">{backers.length - genesisBakers - earlyBackers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backers list */}
      {backers.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-4">All Backers ({backers.length})</h3>
            <div className="space-y-2">
              {backers.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-black/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">{i + 1}</span>
                    <span className="font-mono text-xs">{b.wallet_address?.slice(0, 6)}...{b.wallet_address?.slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Tier {b.tier}</span>
                    <span className="font-medium tabular-nums">{formatSol(b.amount_lamports)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
