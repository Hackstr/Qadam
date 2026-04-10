"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminMilestones } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Milestone as MilestoneIcon, Loader2, Zap, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  grace_period: "bg-amber-50 text-amber-700",
  submitted: "bg-blue-50 text-blue-700",
  ai_processing: "bg-purple-50 text-purple-700",
  under_human_review: "bg-purple-50 text-purple-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  extension_requested: "bg-amber-50 text-amber-700",
  voting_active: "bg-amber-50 text-amber-700",
  extended: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-700",
};

const PRESETS = [
  { key: "", label: "All", icon: MilestoneIcon },
  { key: "stuck", label: "Stuck in AI", icon: Zap },
  { key: "overdue", label: "Overdue", icon: Clock },
  { key: "past_grace", label: "Past Grace", icon: AlertTriangle },
  { key: "recent", label: "Recently Decided", icon: CheckCircle2 },
];

export default function AdminMilestonesPage() {
  const [preset, setPreset] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-milestones", preset, statusFilter],
    queryFn: () => getAdminMilestones({
      preset: preset || undefined,
      status: statusFilter || undefined,
    }),
  });

  const milestones = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MilestoneIcon className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Milestones</h1>
        <span className="text-sm text-muted-foreground">({milestones.length})</span>
      </div>

      {/* Preset tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          return (
            <Button
              key={p.key}
              variant={preset === p.key ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => { setPreset(p.key); setStatusFilter(""); }}
            >
              <Icon className="h-3.5 w-3.5" /> {p.label}
            </Button>
          );
        })}
      </div>

      {/* Status filter (when not using preset) */}
      {!preset && (
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : milestones.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No milestones found.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">AI</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Amount</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m: any) => (
                  <tr key={m.id} className="border-t border-black/[0.04] hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/campaigns/${m.campaign_id}`} className="hover:underline text-sm truncate block max-w-[160px]">
                        {m.campaign_title || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{(m.index ?? 0) + 1}</td>
                    <td className="px-4 py-2.5 text-sm">{m.title || "Untitled"}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`text-[10px] ${STATUS_COLORS[m.status] || ""}`}>{m.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {m.ai_decision ? (
                        <Badge variant="outline" className="text-[10px]">{m.ai_decision}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell">{formatSol(m.amount_lamports)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground hidden lg:table-cell">
                      {m.deadline ? new Date(m.deadline).toLocaleDateString() : "—"}
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
