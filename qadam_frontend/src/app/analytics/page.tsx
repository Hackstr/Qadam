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
import { formatSol, getExplorerUrl, PROGRAM_ID, SOLANA_NETWORK, lamportsToSol } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, Users, CheckCircle2, Vote, Rocket,
  ArrowUpRight, Shield, ExternalLink,
  GitBranch, Layers, CircleDot,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const RANGES = [
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "All", value: 365 },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState(90);

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

  const s = summary?.data;
  const cats = categories?.data || [];
  const events = activity?.data || [];
  const top = topCampaigns?.data || [];
  const chartData = (timeseries?.data || []).map((p) => ({
    week: new Date(p.week).toLocaleDateString("en", { month: "short", day: "numeric" }),
    sol: lamportsToSol(p.sol_lamports),
    backers: p.backers,
  }));
  const maxCatCount = Math.max(...cats.map((c) => c.count), 1);

  const updatedAt = s?.last_updated_at
    ? new Date(s.last_updated_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-3xl tracking-tight">Analytics</h1>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {updatedAt ? `Updated ${updatedAt}` : "Live"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time snapshot of the Qadam platform. All data verifiable on-chain.
        </p>
      </div>

      {/* Hero metrics — 3 large cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Total Raised</span>
          </div>
          <p className="text-4xl font-mono font-bold tabular-nums tracking-tight">
            {s ? formatSol(s.total_raised_lamports) : "---"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            across {s?.total_campaigns ?? "---"} campaigns
          </p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">In Escrow</span>
          </div>
          <p className="text-4xl font-mono font-bold tabular-nums tracking-tight">
            {s ? formatSol(s.sol_in_escrow) : "---"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            held in on-chain vaults
          </p>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Backers</span>
          </div>
          <p className="text-4xl font-mono font-bold tabular-nums tracking-tight">
            {s?.total_backers ?? "---"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {s && s.new_backers_30d > 0 && s.total_backers > s.new_backers_30d
              ? `+${s.new_backers_30d} last 30 days`
              : "unique positions"}
          </p>
        </div>
      </div>

      {/* Secondary pulse — compact stats (hide zeros gracefully) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Active", value: s?.active_campaigns, icon: Rocket },
          { label: "Completed", value: s?.completed_campaigns, icon: CheckCircle2 },
          { label: "Votes Open", value: s?.voting_active, icon: Vote, hideIfZero: true },
          { label: "Milestones Approved", value: s?.approved_milestones, icon: Layers },
        ].filter((stat) => !(stat.hideIfZero && stat.value === 0)).map((stat) => (
          <div key={stat.label} className="bg-white border border-black/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div>
              <p className="text-lg font-mono font-semibold tabular-nums">{stat.value ?? "---"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SOL Flow Chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              SOL Raised Over Time
            </h2>
            <div className="flex items-center gap-0 bg-black/[0.03] rounded-full p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1 text-[10px] font-medium rounded-full transition-colors ${
                    range === r.value
                      ? "bg-white shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="solGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D5F4E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2D5F4E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#6B7065" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B7065" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}`}
                  width={32}
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
                  formatter={(value: any) => [`${Number(value).toFixed(1)} SOL`, "Raised"]}
                  labelStyle={{ color: "#7A9985", fontSize: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="sol"
                  stroke="#2D5F4E"
                  strokeWidth={2}
                  fill="url(#solGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Categories + Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Campaigns by Category
          </h2>
          {cats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {cats.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{cat.category}</span>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-black/[0.03] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-6">
          <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Top Campaigns
          </h2>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No data yet</p>
          ) : (
            <div className="space-y-3">
              {top.map((c, i) => {
                const progress = c.goal_lamports > 0 ? Math.min(100, Math.round((c.raised_lamports / c.goal_lamports) * 100)) : 0;
                return (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-black/[0.02] transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground/40 font-mono w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-amber-600 transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatSol(c.raised_lamports)}</span>
                        <span className="text-xs text-muted-foreground/40">{progress}%</span>
                        {c.category && <span className="text-[10px] text-muted-foreground/40">{c.category}</span>}
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white border border-black/[0.06] rounded-2xl p-6 mb-10">
        <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Recent Activity
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No activity yet</p>
        ) : (
          <div className="space-y-0">
            {events.map((event, i) => (
              <ActivityRow key={event.id} event={event} isLast={i === events.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* Trust footer */}
      <div className="border border-black/[0.06] rounded-2xl p-6 bg-secondary/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Every SOL is held in on-chain escrow</p>
            <p className="text-xs text-muted-foreground">
              No human can move funds — only community votes release milestones.
            </p>
            {SOLANA_NETWORK === "devnet" && (
              <p className="text-[10px] text-amber-600 font-medium mt-1.5">
                Devnet — no real funds
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {PROGRAM_ID && (
              <a
                href={getExplorerUrl(PROGRAM_ID)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-black/[0.06] rounded-lg px-3 py-1.5"
              >
                <CircleDot className="h-3 w-3" />
                Program
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href="https://github.com/Hackstr/Qadam"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-black/[0.06] rounded-lg px-3 py-1.5"
            >
              <GitBranch className="h-3 w-3" />
              Source
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Activity Row ───

const EVENT_CONFIG: Record<string, { icon: typeof Rocket; label: string; color: string }> = {
  campaign_launched: { icon: Rocket, label: "launched", color: "bg-amber-500" },
  submitted:           { icon: ArrowUpRight, label: "evidence submitted for", color: "bg-foreground/20" },
  voting_active:       { icon: Vote, label: "vote opened on", color: "bg-purple-500" },
  approved:            { icon: CheckCircle2, label: "milestone approved on", color: "bg-green-600" },
  rejected:            { icon: CircleDot, label: "milestone rejected on", color: "bg-red-500" },
  extension_requested: { icon: Vote, label: "extension requested for", color: "bg-amber-600" },
  failed:              { icon: CircleDot, label: "milestone failed on", color: "bg-red-400" },
  grace_period:        { icon: CircleDot, label: "entered grace period on", color: "bg-foreground/15" },
};

function getEventConfig(event: any) {
  if (event.type === "campaign_launched") return EVENT_CONFIG.campaign_launched;
  if (event.to_state && EVENT_CONFIG[event.to_state]) return EVENT_CONFIG[event.to_state];
  return { icon: CircleDot, label: `${event.to_state || "updated"} on`, color: "bg-foreground/15" };
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ActivityRow({ event, isLast }: { event: any; isLast: boolean }) {
  const config = getEventConfig(event);
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 py-3 ${!isLast ? "border-b border-black/[0.04]" : ""}`}>
      <div className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {event.type === "campaign_launched" ? (
            <>
              <Link href={`/campaigns/${event.campaign_id}`} className="font-medium hover:text-amber-600 transition-colors">
                {event.campaign_title}
              </Link>
              {" "}launched{event.category ? ` in ${event.category}` : ""}
            </>
          ) : (
            <>
              Milestone {(event.milestone_index ?? 0) + 1}
              {event.milestone_title ? ` "${event.milestone_title}"` : ""}{" "}
              {config.label}{" "}
              <Link href={`/campaigns/${event.campaign_id}`} className="font-medium hover:text-amber-600 transition-colors">
                {event.campaign_title}
              </Link>
            </>
          )}
        </p>
      </div>
      <span className="text-xs text-muted-foreground/60 flex-shrink-0 tabular-nums">
        {timeAgo(event.timestamp)}
      </span>
    </div>
  );
}
