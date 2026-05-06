"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, SearchX, ArrowRight } from "lucide-react";
import { SkeletonCards } from "@/components/ui/skeleton-card";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

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
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight mb-1">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Back projects you believe in. SOL stays in escrow until the community approves each milestone.
        </p>
      </div>

      {/* Status toggle — sliding pill */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex items-center gap-0 bg-black/[0.03] rounded-full p-1">
          {STATUSES.map((s) => (
            <button
              key={s.label}
              onClick={() => setStatus(s.value)}
              className="relative px-4 py-1.5 text-sm font-medium z-10 transition-colors"
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

      {/* Categories + Sort — one row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? undefined : cat)}
              className={`px-3 py-1 rounded-full text-xs transition-all border ${
                category === cat
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20 font-medium"
                  : "bg-transparent text-muted-foreground border-black/[0.06] hover:border-black/[0.12] hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <SortDropdown value={sort} onChange={setSort} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

function SortDropdown({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = SORTS.find((s) => s.value === value)?.label || "Newest";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground border border-black/[0.06] rounded-lg px-3 py-1.5 hover:border-black/[0.12] hover:text-foreground transition-colors"
      >
        {currentLabel}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-black/[0.08] rounded-xl shadow-lg py-1 z-20 min-w-[140px]">
          {SORTS.map((s) => (
            <button
              key={s.label}
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === s.value
                  ? "text-foreground font-medium bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
