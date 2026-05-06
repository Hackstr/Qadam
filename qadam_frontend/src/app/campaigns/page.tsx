"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, SearchX, ArrowRight } from "lucide-react";
import { SkeletonCards } from "@/components/ui/skeleton-card";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  "Tech", "Hardware", "Software", "Art & Design", "Music",
  "Film", "Education", "Community", "Research", "Climate",
];
const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "All", value: undefined },
];
const SORTS = [
  { label: "Newest", value: undefined },
  { label: "Trending", value: "trending" },
  { label: "Ending Soon", value: "ending_soon" },
  { label: "Most Backed", value: "most_backed" },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

      {/* Status toggle — sliding pill */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex items-center gap-0 bg-black/[0.03] rounded-full p-1">
          {STATUSES.map((s) => (
            <button
              key={s.label}
              onClick={() => setStatus(s.value)}
              className="relative px-4 py-1.5 text-[13px] font-medium z-10 transition-colors"
            >
              {status === s.value && (
                <motion.div
                  layoutId="status-pill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={`relative z-10 ${status === s.value ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? undefined : cat)}
            className={`px-3 py-1 rounded-full text-[12px] transition-all border ${
              category === cat
                ? "bg-amber-500 text-white border-amber-500 font-medium"
                : "bg-transparent text-muted-foreground border-black/[0.06] hover:border-black/[0.12] hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-end mb-5">
        <div className="relative flex items-center gap-0 text-xs">
          <span className="text-muted-foreground mr-2">Sort:</span>
          {SORTS.map((s) => (
            <button
              key={s.label}
              onClick={() => setSort(s.value)}
              className="relative px-2.5 py-1 text-xs z-10"
            >
              {sort === s.value && (
                <motion.div
                  layoutId="sort-pill"
                  className="absolute inset-0 bg-black/[0.05] rounded-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={`relative z-10 ${sort === s.value ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
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
        </div>
      ) : campaigns.length === 0 ? (
        <div className="max-w-sm mx-auto text-center py-20">
          <SearchX className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns match</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Try adjusting your filters, or be the first builder in this category.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/create">
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                Start a Campaign <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => { setStatus(undefined); setCategory(undefined); setSearch(""); }}
            >
              Reset filters
            </Button>
          </div>
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
