"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminCampaignDetail } from "@/lib/api";
import { formatSol, SOLANA_NETWORK } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import {
  ArrowLeft, Loader2, ExternalLink, Wallet, Users,
  FolderOpen, Calendar,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  completed: "bg-blue-50 text-blue-700",
  refunded: "bg-red-50 text-red-700",
  paused: "bg-amber-50 text-amber-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaign-detail", id],
    queryFn: () => getAdminCampaignDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />;

  const c = data?.data;
  if (!c) return <p className="text-muted-foreground">Campaign not found.</p>;

  const explorerUrl = `https://explorer.solana.com/address/${c.solana_pubkey}${SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""}`;

  return (
    <div>
      <Link href="/admin/campaigns" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">{c.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={STATUS_COLORS[c.status] || ""}>{c.status}</Badge>
            {c.category && <Badge variant="outline">{c.category}</Badge>}
            {c.featured && <Badge className="bg-amber-50 text-amber-700">Featured</Badge>}
          </div>
        </div>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-amber-600 flex items-center gap-1 flex-shrink-0">
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{formatSol(c.goal_lamports)}</p>
          <p className="text-xs text-muted-foreground">Goal</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{formatSol(c.raised_lamports)}</p>
          <p className="text-xs text-muted-foreground">Raised</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{c.backers_count}</p>
          <p className="text-xs text-muted-foreground">Backers</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold tabular-nums">{c.milestones_approved}/{c.milestones_count}</p>
          <p className="text-xs text-muted-foreground">Milestones</p>
        </CardContent></Card>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {c.description && <p className="text-muted-foreground">{c.description}</p>}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Creator: <span className="font-mono">{c.creator_wallet}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Created: {new Date(c.inserted_at).toLocaleDateString()}
            </div>
            {c.tokens_per_lamport && (
              <p className="text-xs text-muted-foreground">Share rate: {c.tokens_per_lamport.toLocaleString()} per SOL</p>
            )}
          </CardContent>
        </Card>

        {/* Backers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Backers ({c.backers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!c.backers || c.backers.length === 0) ? (
              <p className="text-sm text-muted-foreground">No backers yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {c.backers.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{b.wallet_address?.slice(0, 6)}...{b.wallet_address?.slice(-4)}</span>
                    <span className="tabular-nums">{formatSol(b.amount_lamports)}</span>
                    <Badge variant="outline" className="text-[10px]">T{b.tier}</Badge>
                    {b.refund_claimed && <Badge className="bg-red-50 text-red-600 text-[10px]">Refunded</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Milestone Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {c.milestones && c.milestones.length > 0 ? (
            <MilestoneTimeline milestones={c.milestones} />
          ) : (
            <p className="text-sm text-muted-foreground">No milestones.</p>
          )}
        </CardContent>
      </Card>

      {/* Updates */}
      {c.updates && c.updates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Updates ({c.updates.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.updates.map((u: any) => (
              <div key={u.id} className="border-l-2 border-amber-200 pl-3">
                <p className="text-sm font-medium">{u.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{u.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(u.inserted_at).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
