"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, Star, GitBranch } from "lucide-react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => getAdminUsers({ search: search || undefined }),
  });

  const users = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Users</h1>
        <span className="text-sm text-muted-foreground">({users.length})</span>
      </div>

      <div className="relative w-full md:w-64 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wallet or name..." className="pl-9" />
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No users found.</p>
      ) : (
        <div className="border border-black/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Reputation</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Campaigns</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Backed</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Total Backed</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-black/[0.04] hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${u.wallet_address}`} className="hover:underline">
                        <p className="font-medium text-sm">{u.display_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.wallet_address?.slice(0, 6)}...{u.wallet_address?.slice(-4)}</p>
                      </Link>
                      {u.github_verified && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 mt-0.5"><GitBranch className="h-2.5 w-2.5" />{u.github_username}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground hidden md:table-cell">{u.email || "\u2014"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {u.reputation_score != null ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="tabular-nums font-medium">{u.reputation_score}</span>
                        </span>
                      ) : <span className="text-xs text-muted-foreground">\u2014</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell">{u.campaigns_count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell">{u.backed_count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums hidden lg:table-cell">{formatSol(u.total_backed_lamports)}</td>
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
