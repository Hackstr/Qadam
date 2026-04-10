"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAuditLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Loader2, Brain, ShieldAlert, Clock, Cpu } from "lucide-react";

const ACTOR_CONFIG: Record<string, { color: string; icon: typeof Brain }> = {
  "AI Agent": { color: "bg-purple-50 text-purple-700", icon: Brain },
  "Admin": { color: "bg-amber-50 text-amber-700", icon: ShieldAlert },
  "Deadline Monitor": { color: "bg-blue-50 text-blue-700", icon: Clock },
  "System": { color: "bg-gray-100 text-gray-600", icon: Cpu },
};

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => getAdminAuditLog({ limit: 100 }),
    refetchInterval: 30000,
  });

  const entries = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ScrollText className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Audit Log</h1>
        <span className="text-sm text-muted-foreground">({entries.length})</span>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No audit entries yet.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Actor</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Target</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any, i: number) => {
                  const actorCfg = ACTOR_CONFIG[e.actor] || ACTOR_CONFIG["System"];
                  const Icon = actorCfg.icon;
                  return (
                    <tr key={e.id || i} className="border-t border-black/[0.04]">
                      <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${actorCfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {e.actor}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-[10px] font-mono">{e.action}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-sm hidden md:table-cell">
                        {e.campaign_title && (
                          <span>
                            {e.campaign_title}
                            {e.milestone_index != null && <span className="text-muted-foreground"> MS {e.milestone_index + 1}</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                        {e.details && typeof e.details === "object"
                          ? Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(", ")
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
