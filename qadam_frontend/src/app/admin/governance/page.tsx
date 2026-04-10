"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminGovernance } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function AdminGovernancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-governance"],
    queryFn: getAdminGovernance,
    refetchInterval: 30000,
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />;

  const active = data?.data?.active || [];
  const history = data?.data?.history || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Vote className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Governance</h1>
      </div>

      {/* Active Votes */}
      <h2 className="text-sm font-semibold mb-3">Active Votes ({active.length})</h2>

      {active.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground mb-8 border border-black/[0.06] rounded-xl">
          <Vote className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          <p>No active votes</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {active.map((v: any) => (
            <Card key={v.milestone_id}>
              <CardHeader className="pb-3 bg-amber-50/50 border-b border-amber-100">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/admin/campaigns/${v.campaign_id}`} className="hover:underline">
                      <CardTitle className="text-base">{v.campaign_title}</CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Milestone {(v.milestone_index ?? 0) + 1}: {v.milestone_title || "Untitled"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1" /> {v.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-green-600 font-medium">Extend {v.extend_percent}%</span>
                    <span className="text-red-500 font-medium">Refund {v.refund_percent}%</span>
                  </div>
                  <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${v.extend_percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {v.votes_count} votes cast
                    {v.deadline && ` \u00B7 Ends ${new Date(v.deadline).toLocaleDateString()}`}
                  </p>
                </div>

                {/* Individual votes */}
                {v.votes && v.votes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Votes</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {v.votes.map((vote: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-muted-foreground">{vote.wallet?.slice(0, 6)}...{vote.wallet?.slice(-4)}</span>
                          <span className={vote.approve ? "text-green-600" : "text-red-500"}>
                            {vote.approve ? "Extend" : "Refund"}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{vote.power} power</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <h2 className="text-sm font-semibold mb-3">Voting History ({history.length})</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No past votes.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Campaign</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Milestone</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Result</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any, i: number) => (
                <tr key={i} className="border-t border-black/[0.04]">
                  <td className="px-4 py-2.5">{h.campaign_title || "\u2014"}</td>
                  <td className="px-4 py-2.5">{h.milestone_title || "\u2014"}</td>
                  <td className="px-4 py-2.5">
                    {h.result === "extended" ? (
                      <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Extended</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="h-3.5 w-3.5" />Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {h.decided_at ? new Date(h.decided_at).toLocaleDateString() : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
