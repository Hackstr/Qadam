"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { SkeletonCards } from "@/components/ui/skeleton-card";
import { useState, useEffect } from "react";

const CATEGORIES = ["Apps", "Games", "SaaS", "Tools", "Infrastructure"];
const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "All", value: undefined },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["campaigns", status, category, sort, debouncedSearch],
    queryFn: () => getCampaigns({
      status,
      category,
      sort,
      search: debouncedSearch || undefined,
      limit: 50,
    }),
    retry: false,
  });

  const campaigns = data?.data || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="font-display text-3xl tracking-tight mb-1">Discover</h1>
          <p className="text-sm text-muted-foreground">
            Back projects you believe in. SOL stays in escrow until the community approves each milestone.
          </p>
        </div>
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {/* Status pills */}
        <div className="flex items-center gap-1 bg-black/[0.02] rounded-full p-1">
          {STATUSES.map((s) => (
            <button
              key={s.label}
              onClick={() => setStatus(s.value)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                status === s.value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1 bg-black/[0.02] rounded-full p-1">
          {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? undefined : cat)}
                className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                  category === cat
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
          ))}
        </div>
      </div>

      {/* Sort + Results count */}
      <div className="flex items-center justify-between mb-4">
        {!isLoading && campaigns.length > 0 ? (
          <p className="text-xs text-muted-foreground">{campaigns.length} campaigns</p>
        ) : <div />}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground mr-1">Sort:</span>
          {[
            { label: "Newest", value: undefined },
            { label: "Trending", value: "trending" },
            { label: "Most Backed", value: "most_backed" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setSort(s.value)}
              className={`px-2 py-1 rounded-md transition-colors ${
                sort === s.value
                  ? "bg-black/[0.06] text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonCards count={6} />
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Could not load campaigns.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Make sure the backend is running on port 4000.</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No campaigns found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a different filter or create one yourself.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
