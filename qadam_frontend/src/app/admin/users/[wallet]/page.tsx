"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAdminUserDetail } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Star, CheckCircle2, XCircle,
  Trophy, GitBranch, Calendar, Wallet, Mail,
} from "lucide-react";
import Link from "next/link";

export default function AdminUserDetailPage() {
  const { wallet } = useParams<{ wallet: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", wallet],
    queryFn: () => getAdminUserDetail(wallet),
    enabled: !!wallet,
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />;

  const u = data?.data;
  if (!u) return <p className="text-muted-foreground">User not found.</p>;

  const rep = u.reputation;

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {(u.display_name || u.wallet_address)[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{u.display_name || "Anonymous"}</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{u.wallet_address}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {u.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>}
            {u.github_verified && <Badge variant="outline" className="text-[10px] gap-0.5"><GitBranch className="h-2.5 w-2.5" />{u.github_username}</Badge>}
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {new Date(u.inserted_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Reputation */}
      {rep && (
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500" /> Reputation: {rep.score}/100</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />{rep.milestones_on_time} on time</div>
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" />{rep.milestones_late} late</div>
              <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-green-500" />{rep.campaigns_completed} completed</div>
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" />{rep.campaigns_refunded} refunded</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Created campaigns */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Created Campaigns ({u.campaigns?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {(!u.campaigns || u.campaigns.length === 0) ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              <div className="space-y-2">
                {u.campaigns.map((c: any) => (
                  <Link key={c.id} href={`/admin/campaigns/${c.id}`} className="flex items-center justify-between text-sm hover:bg-muted/30 rounded px-2 py-1.5 -mx-2">
                    <span className="font-medium truncate">{c.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="text-[10px]" variant="outline">{c.status}</Badge>
                      <span className="tabular-nums text-xs">{formatSol(c.raised_lamports)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backed positions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Backed Positions ({u.backed_positions?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {(!u.backed_positions || u.backed_positions.length === 0) ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              <div className="space-y-2">
                {u.backed_positions.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{b.campaign_title || "Campaign"}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px]">T{b.tier}</Badge>
                      <span className="tabular-nums text-xs">{formatSol(b.amount_lamports)}</span>
                      {b.refund_claimed && <Badge className="text-[10px] bg-red-50 text-red-600">Refunded</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
