"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getAnalyticsSummary } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { SkeletonCards } from "@/components/ui/skeleton-card";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  SearchX,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

/* ═══ Constants ═══ */
const CATEGORY_SWATCHES: Record<string, string> = {
  Tech: "bg-amber-500",
  Hardware: "bg-foreground",
  Software: "bg-amber-600",
  "Art & Design": "bg-[var(--terracotta)]",
  Music: "bg-[var(--mustard)]",
  Film: "bg-foreground/80",
  Education: "bg-amber-400",
  Community: "bg-[var(--mustard)]",
  Research: "bg-[var(--terracotta)]/70",
  Climate: "bg-amber-500",
  Experience: "bg-amber-400",
  Sports: "bg-foreground/80",
};

const CATEGORIES = Object.keys(CATEGORY_SWATCHES);

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

/* ═══ Animation variants ═══ */
const fadeUp: any = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

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
    queryFn: () =>
      getCampaigns({
        status,
        category,
        sort,
        search: debouncedSearch || undefined,
        limit: 50,
      }),
    retry: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
    staleTime: 60_000,
  });
  const stats = statsData?.data;

  const campaigns = data?.data || [];

  return (
    <div className="max-w-[1240px] mx-auto px-8 animate-page-enter -mt-4">
      {/* ════════════════════════════════════════════════
          PAGE HEADER
         ════════════════════════════════════════════════ */}
      <section className="pt-10 pb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8">
          {/* Left: heading */}
          <div>
            <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
              Discover
            </span>
            <h1 className="font-display text-4xl md:text-[64px] leading-[1.02] tracking-tight mt-2 mb-4">
              Back what you{" "}
              <em className="italic text-amber-500">believe</em> in.
            </h1>
            <p className="text-foreground/80 text-[17px] max-w-[520px] leading-relaxed">
              SOL stays in escrow until the community approves each milestone.
              Every backer earns ownership points proportional to how early they
              show up.
            </p>
          </div>

          {/* Right: live pulse widget */}
          <LivePulse
            solInEscrow={stats?.sol_in_escrow ?? 0}
            activeCampaigns={stats?.active_campaigns ?? 0}
          />
        </div>

        {/* ═══ Filter bar ═══ */}
        <div className="mt-7 bg-card border border-foreground/10 rounded-[22px] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Status segmented control */}
            <div className="relative flex items-center gap-0 bg-secondary rounded-full p-[3px] border border-foreground/[0.06] shrink-0">
              {STATUSES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setStatus(s.value)}
                  className="relative px-4 py-[7px] text-[13px] font-medium z-10 transition-colors whitespace-nowrap"
                >
                  {status === s.value && (
                    <motion.div
                      layoutId="status-pill"
                      className="absolute inset-0 bg-card rounded-full shadow-sm"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${status === s.value ? "text-foreground font-semibold" : "text-foreground/80"}`}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 bg-secondary border border-foreground/[0.06] rounded-full px-3.5 py-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project, creator, wallet..."
                className="flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none min-w-0"
              />
              <span className="font-mono text-[11px] text-muted-foreground border border-foreground/10 px-1.5 py-0.5 rounded-md bg-card shrink-0 hidden sm:inline">
                /
              </span>
            </div>

            {/* Sort + Submit CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              <SortDropdown value={sort} onChange={setSort} />
              <Link href="/create">
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2.5 h-auto text-[13.5px] font-semibold whitespace-nowrap">
                  + Submit project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Category pills ═══ */}
        <div className="flex flex-wrap gap-1.5 pt-4">
          <button
            onClick={() => setCategory(undefined)}
            className={`inline-flex items-center gap-2 px-3 py-[7px] rounded-full text-[13px] font-medium transition-all border whitespace-nowrap ${
              !category
                ? "bg-foreground border-foreground text-background"
                : "bg-transparent border-foreground/10 text-foreground/80 hover:border-foreground/20 hover:bg-card"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setCategory(category === cat ? undefined : cat)
              }
              className={`inline-flex items-center gap-2 px-3 py-[7px] rounded-full text-[13px] font-medium transition-all border whitespace-nowrap ${
                category === cat
                  ? "bg-foreground border-foreground text-background"
                  : "bg-transparent border-foreground/10 text-foreground/80 hover:border-foreground/20 hover:bg-card"
              }`}
            >
              <span
                className={`w-[7px] h-[7px] rounded-full ${CATEGORY_SWATCHES[cat] || "bg-foreground/40"}`}
              />
              {cat}
            </button>
          ))}
        </div>

        {/* ═══ Results meta ═══ */}
        <div className="flex justify-between items-center mt-4 text-[13px] text-muted-foreground">
          <div>
            <span className="text-foreground font-semibold">
              {campaigns.length} projects
            </span>
            {!isLoading && (
              <>
                {" "}
                {status === "active" || !status ? "live" : status}
                {stats?.sol_in_escrow
                  ? ` \u00B7 \u25E6 ${stats.sol_in_escrow.toLocaleString()} funding pool`
                  : ""}
              </>
            )}
          </div>
          {campaigns.length > 0 && (
            <span className="font-mono text-xs">
              showing {campaigns.length}
            </span>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CAMPAIGN GRID
         ════════════════════════════════════════════════ */}
      <section className="pb-14">
        {isLoading ? (
          <SkeletonCards count={6} />
        ) : isError ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center py-20"
          >
            <p className="text-muted-foreground">
              Could not load campaigns.
            </p>
          </motion.div>
        ) : campaigns.length === 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-sm mx-auto text-center py-20"
          >
            <SearchX className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-display text-lg mb-2">No campaigns match</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Try adjusting your filters, or be the first builder in this
              category.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/create">
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                  Start a Campaign{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="rounded-full border-foreground/10"
                onClick={() => {
                  setStatus(undefined);
                  setCategory(undefined);
                  setSearch("");
                }}
              >
                Reset filters
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px]"
          >
            {campaigns.map((campaign) => (
              <motion.div key={campaign.id} variants={fadeUp}>
                <CampaignCard campaign={campaign} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Live pulse widget — dark band with real-time stats
   ═══════════════════════════════════════════════════════════ */
function LivePulse({
  solInEscrow,
  activeCampaigns,
}: {
  solInEscrow: number;
  activeCampaigns: number;
}) {
  return (
    <div className="flex items-center gap-4 bg-foreground text-background px-5 py-4 rounded-[22px] w-full lg:w-auto lg:min-w-[420px] shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_22px_44px_-28px_rgba(22,32,26,0.18)]">
      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 shadow-[0_0_0_3px_rgba(107,212,155,0.25)] animate-pulse" />
      <div className="font-mono text-xs flex-1 min-w-0">
        <div className="text-background truncate">
          Live on Solana{" "}
          <span className="text-amber-300">devnet</span>
        </div>
        <div className="text-background/55 mt-0.5 truncate">
          Community-governed escrow
        </div>
      </div>
      <div className="flex gap-5 pl-4 border-l border-background/15 shrink-0">
        <div>
          <div className="font-display text-[22px] leading-none tracking-tight text-background">
            {"\u25E6"} {solInEscrow.toLocaleString()}
          </div>
          <div className="text-[10px] tracking-[0.06em] uppercase text-background/55 mt-1">
            In escrow
          </div>
        </div>
        <div>
          <div className="font-display text-[22px] leading-none tracking-tight text-background">
            {activeCampaigns}
          </div>
          <div className="text-[10px] tracking-[0.06em] uppercase text-background/55 mt-1">
            Live
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sort dropdown
   ═══════════════════════════════════════════════════════════ */
function SortDropdown({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    SORTS.find((s) => s.value === value)?.label || "Newest";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[13px] font-medium text-foreground/80 bg-secondary border border-foreground/[0.06] rounded-full px-3.5 py-2.5 hover:bg-card hover:border-foreground/[0.12] transition-colors whitespace-nowrap"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Sort: {currentLabel}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-foreground/10 rounded-xl shadow-lg py-1 z-20 min-w-[140px]">
          {SORTS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === s.value
                  ? "text-foreground font-medium bg-amber-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
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
