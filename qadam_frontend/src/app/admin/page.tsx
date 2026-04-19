"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Loader2, FolderOpen, Wallet, Users,
  ClipboardCheck, TrendingUp, Brain, AlertTriangle, Clock, Zap,
} from "lucide-react";
import Link from "next/link";
import type { AdminAttentionItem, AdminActivityItem } from "@/types";

const ATTENTION_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertTriangle; link: string }> = {
  needs_review: { label: "Needs Review", color: "text-purple-600 bg-purple-50", icon: ClipboardCheck, link: "/admin/reviews" },
  overdue: { label: "Overdue", color: "text-red-600 bg-red-50", icon: Clock, link: "/admin/milestones" },
  stuck_in_ai: { label: "Stuck in AI", color: "text-amber-600 bg-amber-50", icon: Zap, link: "/admin/milestones" },
};

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
    refetchInterval: 30000, // refresh every 30s
  });

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />;
  }

  const d = data?.data;
  if (!d) return (
    <div className="text-center py-16">
      <p className="font-medium text-red-500 mb-1">Failed to load dashboard</p>
      <p className="text-sm text-muted-foreground">Make sure you are signed in — disconnect and reconnect your wallet to trigger authentication.</p>
    </div>
  );

  const metrics = [
    { label: "Active Campaigns", value: d.active_campaigns, icon: FolderOpen, color: "text-blue-600" },
    { label: "Total Raised", value: formatSol(d.total_raised_lamports), icon: Wallet, color: "text-green-600" },
    { label: "Total Backers", value: d.total_backers, icon: Users, color: "text-indigo-600" },
    { label: "Pending Reviews", value: d.pending_reviews, icon: ClipboardCheck, color: d.pending_reviews > 0 ? "text-amber-600" : "text-muted-foreground", badge: d.pending_reviews > 0 },
    { label: "Success Rate", value: `${d.success_rate}%`, icon: TrendingUp, color: "text-green-600" },
    { label: "AI Accuracy", value: d.total_decisions > 0 ? `${d.ai_accuracy}%` : "N/A", icon: Brain, color: "text-purple-600" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Overview</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${m.color}`} />
                  {m.badge && <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">!</Badge>}
                </div>
                <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Needs Attention */}
      {d.needs_attention.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Needs Attention ({d.needs_attention.length})</h2>
          </div>
          <div className="border border-black/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Milestone</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {d.needs_attention.map((item: AdminAttentionItem, i: number) => {
                  const config = ATTENTION_CONFIG[item.type] || ATTENTION_CONFIG.overdue;
                  const Icon = config.icon;
                  return (
                    <tr key={i} className="border-t border-black/[0.04]">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm">{item.campaign_title || "—"}</td>
                      <td className="px-4 py-2.5 text-sm">
                        {item.milestone_title || `#${(item.milestone_index ?? 0) + 1}`}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={config.link} className="text-xs text-amber-600 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
        {d.recent_activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {d.recent_activity.map((item: AdminActivityItem) => (
              <div key={item.id} className="flex items-center justify-between text-sm border border-black/[0.04] rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {item.from_state} → {item.to_state}
                  </Badge>
                  <span className="text-muted-foreground">
                    {item.campaign_title}
                    {item.milestone_index != null && ` — MS ${item.milestone_index + 1}`}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
