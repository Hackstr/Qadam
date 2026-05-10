"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsSummary,
  getAnalyticsCategories,
  getAnalyticsActivity,
  getAnalyticsTopCampaigns,
  getAnalyticsTimeseries,
} from "@/lib/api";
import { getExplorerUrl, PROGRAM_ID, SOLANA_NETWORK, lamportsToSol } from "@/lib/constants";
import Link from "next/link";
import {
  TrendingUp, Users, Shield, Rocket, CheckCircle2,
  ArrowUpRight, ExternalLink, GitBranch, CircleDot,
  Vote, Lock, Download, ChevronUp,
  CheckSquare, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── Constants ─── */

const RANGES = [
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "All", value: 365 },
] as const;

const NEGATIVE_STATES = new Set(["failed", "rejected", "grace_period"]);

const CATEGORY_COLORS = [
  "bg-amber-500",      // green primary
  "bg-amber-400",      // green-2
  "bg-foreground",     // ink
  "bg-[var(--terracotta)]",
  "bg-[var(--mustard)]",
  "bg-amber-700",
];

const CATEGORY_BAR_COLORS = [
  "bg-amber-500",
  "bg-amber-400",
  "bg-foreground",
  "bg-[var(--terracotta)]",
  "bg-[var(--mustard)]",
  "bg-amber-700",
];

/* ─── Main Page ─── */

export default function AnalyticsPage() {
  const [range, setRange] = useState(90);
  const [chartMode, setChartMode] = useState<"cumulative" | "daily">("daily");

  /* Queries — kept exactly as before */
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ["analytics-categories"],
    queryFn: getAnalyticsCategories,
    retry: false,
  });

  const { data: activity } = useQuery({
    queryKey: ["analytics-activity"],
    queryFn: () => getAnalyticsActivity(15),
    retry: false,
    refetchInterval: 30000,
  });

  const { data: topCampaigns } = useQuery({
    queryKey: ["analytics-top"],
    queryFn: getAnalyticsTopCampaigns,
    retry: false,
  });

  const { data: timeseries } = useQuery({
    queryKey: ["analytics-timeseries", range],
    queryFn: () => getAnalyticsTimeseries(range),
    retry: false,
  });

  /* Derived data */
  const s = summary?.data;
  const cats = categories?.data || [];
  const top = topCampaigns?.data || [];

  const events = (() => {
    const raw = activity?.data || [];
    const filtered: typeof raw = [];
    let negStreak = 0;
    for (const e of raw) {
      const isNeg = NEGATIVE_STATES.has(e.to_state || "");
      if (isNeg) {
        negStreak++;
        if (negStreak > 2) continue;
      } else {
        negStreak = 0;
      }
      filtered.push(e);
    }
    return filtered;
  })();

  const chartData = (timeseries?.data || []).map((p) => ({
    week: new Date(p.week).toLocaleDateString("en", { month: "short", day: "numeric" }),
    sol: lamportsToSol(p.sol_lamports),
    backers: p.backers,
  }));

  const totalCatSol = cats.reduce((sum, c) => sum + Number(c.raised_lamports), 0);

  const updatedLabel = (() => {
    if (!s?.last_updated_at) return "Live";
    const diff = Date.now() - new Date(s.last_updated_at).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `Updated ${secs}s ago`;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Updated ${mins}m ago`;
    return `Updated ${Math.floor(mins / 60)}h ago`;
  })();

  const totalRaisedSol = s ? lamportsToSol(Number(s.total_raised_lamports)) : 0;
  const escrowSol = s ? lamportsToSol(Number(s.sol_in_escrow)) : 0;
  const escrowPct = totalRaisedSol > 0 ? ((escrowSol / totalRaisedSol) * 100).toFixed(1) : "0";
  const approvedRatio = s ? `${s.approved_milestones} / ${s.total_milestones}` : "---";

  return (
    <div className="max-w-[1240px] mx-auto px-8 py-12 animate-page-enter">

      {/* ═══ Header ═══ */}
      <section className="mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_0_3px_rgba(107,212,155,0.25)] animate-pulse" />
              {updatedLabel.toUpperCase()} &middot; {SOLANA_NETWORK.toUpperCase()}
            </span>
            <h1 className="font-display text-6xl md:text-7xl tracking-tight leading-none mb-3.5">
              The platform, in <em className="italic text-amber-500">numbers</em>.
            </h1>
            <p className="text-[17px] text-foreground/80 max-w-xl leading-relaxed">
              Real-time snapshot of every campaign, vote, and SOL movement. All data verifiable on-chain — nothing massaged.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Range toggle */}
            <div className="inline-flex p-[3px] bg-card border border-border rounded-full">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    range === r.value
                      ? "bg-amber-500 text-white font-semibold"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card border border-border text-[13px] font-medium text-foreground/70 hover:border-foreground/20 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {PROGRAM_ID && (
              <a
                href={getExplorerUrl(PROGRAM_ID)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-card border border-border text-[13px] font-medium text-foreground/70 hover:border-foreground/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Solscan
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ═══ 3 Hero KPI Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <KpiCard
          icon={<TrendingUp className="w-3.5 h-3.5 text-amber-500" />}
          label="Total Raised"
          value={s ? lamportsToSol(s.total_raised_lamports).toFixed(2) : "---"}
          unit="SOL"
          sub={<>across {s?.total_campaigns ?? "---"} campaigns</>}
        />
        <KpiCard
          icon={<Shield className="w-3.5 h-3.5 text-amber-500" />}
          label="In Escrow"
          value={s ? escrowSol.toFixed(2) : "---"}
          unit="SOL"
          sub={
            <>
              held in on-chain vaults{" "}
              {s && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#7C5B1F] bg-[rgba(200,146,58,0.14)] rounded-full px-2 py-0.5 ml-1.5">
                  {escrowPct}% of total
                </span>
              )}
            </>
          }
        />
        <KpiCard
          icon={<Users className="w-3.5 h-3.5 text-amber-500" />}
          label="Backers"
          value={s?.total_backers?.toString() ?? "---"}
          unit="unique wallets"
          sub={
            s && s.new_backers_30d > 0 ? (
              <>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-500 bg-amber-50 rounded-full px-2 py-0.5">
                  <ChevronUp className="w-3 h-3" /> +{s.new_backers_30d} this month
                </span>
              </>
            ) : (
              <>unique positions</>
            )
          }
        />
      </div>

      {/* ═══ 3 Secondary Pulse Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PulseCard
          icon={<Rocket className="w-[18px] h-[18px]" />}
          iconBg="bg-amber-50 text-amber-500"
          value={s?.active_campaigns?.toString() ?? "---"}
          label="Active campaigns"
        />
        <PulseCard
          icon={<CheckCircle2 className="w-[18px] h-[18px]" />}
          iconBg="bg-secondary text-foreground"
          value={s?.completed_campaigns?.toString() ?? "---"}
          label="Completed / shipped"
        />
        <PulseCard
          icon={<CheckSquare className="w-[18px] h-[18px]" />}
          iconBg="bg-amber-50 text-amber-500"
          value={approvedRatio}
          label="Milestones approved"
        />
      </div>

      {/* ═══ SOL Chart ═══ */}
      <div className="bg-card border border-border rounded-[22px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] mb-6">
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <h3 className="font-display text-[22px] font-medium tracking-tight">SOL raised over time</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Cumulative across all campaigns &middot; last {range === 365 ? "all time" : `${range} days`}
            </p>
          </div>
          <div className="inline-flex p-[3px] bg-card border border-border rounded-full">
            {(["cumulative", "daily"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium capitalize transition-colors ${
                  chartMode === mode
                    ? "bg-amber-500 text-white font-semibold"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 1 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="solGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10.5, fill: "var(--muted-foreground)", fontFamily: "var(--font-geist-mono), monospace" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fill: "var(--muted-foreground)", fontFamily: "var(--font-geist-mono), monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}`}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1A2421",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#E8F0EC",
                    padding: "8px 12px",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} SOL`, "Raised"]}
                  labelStyle={{ color: "#7A9985", fontSize: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="sol"
                  stroke="var(--primary)"
                  strokeWidth={2.4}
                  fill="url(#solGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/15 mb-3" />
            <p className="text-sm text-muted-foreground/40">Chart appears after the first week of activity</p>
          </div>
        )}
      </div>

      {/* ═══ Two-col: Categories + Top Campaigns ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 mb-6">

        {/* Categories by SOL */}
        <div className="bg-card border border-border rounded-[22px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-[22px] font-medium tracking-tight">Campaigns by category</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">Where backers are putting SOL</p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{cats.length} total</span>
          </div>

          {cats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No data yet</p>
          ) : (
            <div>
              {cats.map((cat, i) => {
                const raisedNum = Number(cat.raised_lamports);
                const solVal = lamportsToSol(raisedNum);
                const pct = totalCatSol > 0 ? ((raisedNum / totalCatSol) * 100).toFixed(1) : "0";
                const barColor = CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length];
                const swatchColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                const barPct = totalCatSol > 0 ? (raisedNum / totalCatSol) * 100 : 0;
                return (
                  <div key={cat.category} className={`py-3.5 ${i < cats.length - 1 ? "border-b border-black/[0.04]" : ""}`}>
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-[9px] h-[9px] rounded-full ${swatchColor}`} />
                        <span className="text-sm font-medium">{cat.category}</span>
                      </div>
                      <div className="flex items-baseline gap-3 font-mono text-xs text-muted-foreground">
                        <span className="font-display text-[17px] text-foreground tracking-tight">{cat.count}</span>
                        <span>{solVal.toFixed(2)} SOL</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-black/[0.04] rounded overflow-hidden flex">
                      <span className={`block h-full ${barColor} rounded`} style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Campaigns */}
        <div className="bg-card border border-border rounded-[22px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-[22px] font-medium tracking-tight">Top campaigns</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">Sorted by SOL raised, all time</p>
            </div>
            <Link href="/discover" className="text-[13px] text-amber-500 font-medium hover:underline">
              View all {s?.total_campaigns ?? ""} &rarr;
            </Link>
          </div>

          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No data yet</p>
          ) : (
            <div>
              {top.map((c, i) => {
                const progress = c.goal_lamports > 0 ? Math.min(100, Math.round((c.raised_lamports / c.goal_lamports) * 100)) : 0;
                const raisedSol = lamportsToSol(c.raised_lamports);
                const isUnderFunded = progress < 30;
                return (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className={`grid grid-cols-[32px_1fr_90px_80px_auto] gap-3.5 items-center py-3.5 group ${
                      i < top.length - 1 ? "border-b border-black/[0.04]" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-base font-medium tracking-tight truncate group-hover:text-amber-500 transition-colors">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.category && (
                          <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-secondary border border-border">
                            {c.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-display text-[17px] tracking-tight">
                      {raisedSol.toFixed(2)}
                      <span className="text-[11px] text-muted-foreground font-sans ml-1">SOL</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`font-mono text-[11.5px] font-medium ${isUnderFunded ? "text-[var(--terracotta)]" : "text-amber-500"}`}>
                        {progress}% funded
                      </span>
                      <span className="h-1 bg-black/[0.04] rounded-sm overflow-hidden">
                        <span
                          className={`block h-full rounded-sm ${isUnderFunded ? "bg-[var(--terracotta)]" : "bg-amber-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                    </div>
                    <CampaignStatusBadge status={c.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Activity Feed ═══ */}
      <div className="bg-card border border-border rounded-[22px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] mb-6">
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <h3 className="font-display text-[22px] font-medium tracking-tight">Recent activity</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Latest on-chain events across the platform</p>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No activity yet</p>
        ) : (
          <div>
            {events.map((event, i) => (
              <ActivityRow key={event.id} event={event} isLast={i === events.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* ═══ Trust Band ═══ */}
      <div className="bg-foreground text-background rounded-[22px] px-7 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 shadow-[0_22px_44px_-28px_rgba(22,32,26,0.18)]">
        <div className="flex items-center gap-4">
          <div className="w-[38px] h-[38px] rounded-xl bg-white/10 grid place-items-center flex-shrink-0">
            <Lock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <p className="font-display text-[19px]">Every SOL is held in on-chain escrow.</p>
            <p className="text-[13px] opacity-60 mt-0.5">No human can move funds — only community votes release milestones.</p>
            {SOLANA_NETWORK === "devnet" && (
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-[rgba(200,146,58,0.18)] text-[#E8C281] text-[11px] font-semibold">
                Devnet &middot; no real funds
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {PROGRAM_ID && (
            <a
              href={getExplorerUrl(PROGRAM_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-[13px] font-medium hover:bg-white/10 transition-colors"
            >
              <CircleDot className="w-3.5 h-3.5" />
              Program
            </a>
          )}
          <a
            href="https://github.com/Hackstr/Qadam"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-[13px] font-medium hover:bg-white/10 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Source
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card (hero) ─── */

function KpiCard({
  icon,
  label,
  value,
  unit,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-[22px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] relative overflow-hidden">
      <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-bold">
        {icon}
        {label}
      </div>
      <p className="font-display text-[60px] leading-none tracking-tight mt-3.5 mb-1.5">
        {value}
        <span className="text-lg text-muted-foreground font-sans font-medium tracking-normal ml-2">{unit}</span>
      </p>
      <p className="text-[13px] text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ─── Pulse Card (secondary) ─── */

function PulseCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <div className={`w-9 h-9 rounded-xl ${iconBg} grid place-items-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="font-display text-[28px] leading-none tracking-tight">{value}</p>
        <p className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-bold mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ─── Campaign Status Badge ─── */

function CampaignStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let classes = "bg-secondary text-foreground/70";
  let dot: React.ReactNode = null;

  if (s === "active" || s === "live") {
    classes = "bg-amber-50 text-amber-500";
    dot = <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />;
  } else if (s === "completed" || s === "shipped") {
    classes = "bg-secondary text-foreground/70";
  } else if (s === "ending") {
    classes = "bg-[rgba(200,146,58,0.12)] text-[#7C5B1F]";
  }

  const label = s === "active" ? "Live" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold justify-self-end whitespace-nowrap ${classes}`}>
      {dot}
      {label}
    </span>
  );
}

/* ─── Activity Row ─── */

const EVENT_CONFIG: Record<string, { icon: typeof Rocket; label: string; iconClass: string }> = {
  campaign_launched:   { icon: Rocket,       label: "launched",                  iconClass: "bg-[rgba(200,146,58,0.14)] text-[#7C5B1F]" },
  submitted:           { icon: ArrowUpRight, label: "evidence submitted for",    iconClass: "bg-secondary text-foreground" },
  voting_active:       { icon: Vote,         label: "vote opened on",            iconClass: "bg-amber-50 text-amber-500" },
  approved:            { icon: CheckCircle2, label: "milestone approved on",     iconClass: "bg-amber-50 text-amber-500" },
  rejected:            { icon: CircleDot,    label: "milestone rejected on",     iconClass: "bg-[rgba(194,83,46,0.10)] text-[var(--terracotta)]" },
  extension_requested: { icon: Vote,         label: "extension requested for",   iconClass: "bg-[rgba(200,146,58,0.14)] text-[#7C5B1F]" },
  failed:              { icon: CircleDot,    label: "milestone failed on",       iconClass: "bg-[rgba(194,83,46,0.10)] text-[var(--terracotta)]" },
  grace_period:        { icon: CircleDot,    label: "entered grace period on",   iconClass: "bg-secondary text-foreground" },
};

function getEventConfig(event: { type: string; to_state: string | null }) {
  if (event.type === "campaign_launched") return EVENT_CONFIG.campaign_launched;
  if (event.to_state && EVENT_CONFIG[event.to_state]) return EVENT_CONFIG[event.to_state];
  return { icon: CircleDot, label: `${event.to_state || "updated"} on`, iconClass: "bg-secondary text-foreground" };
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ActivityRow({ event, isLast }: { event: { id: string; type: string; from_state: string | null; to_state: string | null; milestone_index: number | null; milestone_title: string | null; campaign_id: string; campaign_title: string; category: string | null; metadata: Record<string, unknown>; timestamp: string }; isLast: boolean }) {
  const config = getEventConfig(event);
  const Icon = config.icon;

  return (
    <div className={`grid grid-cols-[36px_1fr_auto_auto] gap-3.5 items-center py-3.5 ${!isLast ? "border-b border-black/[0.04]" : ""}`}>
      <div className={`w-9 h-9 rounded-xl ${config.iconClass} grid place-items-center flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm min-w-0">
        {event.type === "campaign_launched" ? (
          <>
            <Link href={`/campaigns/${event.campaign_id}`} className="font-medium hover:text-amber-500 transition-colors">
              {event.campaign_title}
            </Link>
            {" "}launched{event.category ? ` in ${event.category}` : ""}
          </>
        ) : (
          <>
            Milestone {(event.milestone_index ?? 0) + 1}
            {event.milestone_title ? ` "${event.milestone_title}"` : ""}{" "}
            {config.label}{" "}
            <Link href={`/campaigns/${event.campaign_id}`} className="font-medium hover:text-amber-500 transition-colors">
              {event.campaign_title}
            </Link>
          </>
        )}
      </div>
      <span className="font-mono text-[11.5px] text-muted-foreground whitespace-nowrap">
        {timeAgo(event.timestamp)}
      </span>
    </div>
  );
}
