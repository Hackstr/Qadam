"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAiStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DECISION_COLORS = { approved: "#22c55e", rejected: "#ef4444", partial: "#f59e0b" };

export default function AdminAiPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: getAdminAiStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />;

  const d = data?.data;
  if (!d) return <p className="text-muted-foreground">Failed to load AI stats.</p>;

  const pieData = [
    { name: "Approved", value: d.approved, color: DECISION_COLORS.approved },
    { name: "Rejected", value: d.rejected, color: DECISION_COLORS.rejected },
    { name: "Partial", value: d.partial, color: DECISION_COLORS.partial },
  ].filter((p) => p.value > 0);

  const metrics = [
    { label: "Total Decisions", value: d.total_decisions, icon: Brain, color: "text-purple-600" },
    { label: "Approval Rate", value: `${d.approval_rate}%`, icon: CheckCircle2, color: "text-green-600" },
    { label: "Partial Rate", value: `${d.partial_rate}%`, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Avg Latency", value: d.avg_latency_ms ? `${d.avg_latency_ms}ms` : "N/A", icon: Clock, color: "text-blue-600" },
    { label: "Stuck Jobs", value: d.stuck_count, icon: Zap, color: d.stuck_count > 0 ? "text-red-600" : "text-muted-foreground" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">AI Analytics</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                <p className="text-lg font-bold tabular-nums">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Decision Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No decisions yet.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend + counts */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> Approved</span>
              <span className="font-bold tabular-nums">{d.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><XCircle className="h-4 w-4 text-red-500" /> Rejected</span>
              <span className="font-bold tabular-nums">{d.rejected}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-amber-500" /> Partial (Human Review)</span>
              <span className="font-bold tabular-nums">{d.partial}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Decisions */}
      <h2 className="text-sm font-semibold mb-3">Recent Decisions</h2>
      {(!d.recent_decisions || d.recent_decisions.length === 0) ? (
        <p className="text-sm text-muted-foreground">No AI decisions yet.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">MS</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Decision</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Explanation</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Latency</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {d.recent_decisions.map((dec: any) => (
                  <tr key={dec.id} className="border-t border-black/[0.04]">
                    <td className="px-4 py-2.5 text-sm truncate max-w-[150px]">{dec.campaign_title || "\u2014"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{(dec.milestone_index ?? 0) + 1}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`text-[10px] ${
                        dec.decision === "approved" ? "bg-green-50 text-green-700" :
                        dec.decision === "rejected" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{dec.decision}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                      {dec.explanation || "\u2014"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs hidden sm:table-cell">
                      {dec.latency_ms ? `${dec.latency_ms}ms` : "\u2014"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {new Date(dec.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
