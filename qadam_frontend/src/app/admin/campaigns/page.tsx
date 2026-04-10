"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminCampaigns, toggleFeatured, pauseCampaign, resumeCampaign } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen, Search, Loader2, Star, StarOff,
  Pause, Play, Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  completed: "bg-blue-50 text-blue-700",
  refunded: "bg-red-50 text-red-700",
  paused: "bg-amber-50 text-amber-700",
  cancelled: "bg-gray-100 text-gray-600",
  draft: "bg-gray-100 text-gray-500",
};

export default function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-campaigns", search, statusFilter, categoryFilter],
    queryFn: () => getAdminCampaigns({
      search: search || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    }),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => toggleFeatured(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Featured status updated");
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign paused");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      toast.success("Campaign resumed");
    },
  });

  const campaigns = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Campaigns</h1>
        <span className="text-sm text-muted-foreground">({campaigns.length})</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          {["active", "completed", "refunded", "paused", "cancelled", "draft"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {["Apps", "Games", "SaaS", "Tools", "Infrastructure"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : campaigns.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No campaigns found.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Raised</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Backers</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Milestones</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="border-t border-black/[0.04] hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.creator_wallet?.slice(0, 6)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${STATUS_COLORS[c.status] || ""}`}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.category || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatSol(c.raised_lamports)}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{c.backers_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                      {c.milestones_approved}/{c.milestones_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/campaigns/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => featureMutation.mutate({ id: c.id, featured: !c.featured })}
                        >
                          {c.featured
                            ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            : <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </Button>
                        {c.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => pauseMutation.mutate(c.id)}
                          >
                            <Pause className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        )}
                        {c.status === "paused" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => resumeMutation.mutate(c.id)}
                          >
                            <Play className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        )}
                      </div>
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
