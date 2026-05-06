"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsSummary,
  getAnalyticsCategories,
  getAnalyticsActivity,
  getAnalyticsTopCampaigns,
} from "@/lib/api";
import { formatSol, getExplorerUrl, PROGRAM_ID } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, Users, CheckCircle2, Vote, Rocket,
  ArrowUpRight, Shield, ExternalLink, Loader2,
  GitBranch, Layers, CircleDot,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: any = { visible: { transition: { staggerChildren: 0.06 } } };

export default function AnalyticsPage() {
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

  const s = summary?.data;
  const cats = categories?.data || [];
  const events = activity?.data || [];
  const top = topCampaigns?.data || [];
  const maxCatCount = Math.max(...cats.map((c) => c.count), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-3xl tracking-tight">Analytics</h1>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time snapshot of the Qadam platform. All data verifiable on-chain.
          </p>
        </motion.div>

        {/* Hero metrics — 3 large cards */}
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Total Raised</span>
            </div>
            <p className="text-3xl font-mono font-bold tabular-nums tracking-tight">
              {s ? formatSol(s.total_raised_lamports) : "---"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across {s?.total_campaigns ?? "---"} campaigns
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">In Escrow</span>
            </div>
            <p className="text-3xl font-mono font-bold tabular-nums tracking-tight">
              {s ? formatSol(s.sol_in_escrow) : "---"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              held in on-chain vaults
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Backers</span>
            </div>
            <p className="text-3xl font-mono font-bold tabular-nums tracking-tight">
              {s?.total_backers ?? "---"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {s && s.new_backers_30d > 0 ? `+${s.new_backers_30d} last 30 days` : "unique positions"}
            </p>
          </motion.div>
        </motion.div>

        {/* Secondary pulse — 4 inline stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Active", value: s?.active_campaigns, icon: Rocket },
            { label: "Completed", value: s?.completed_campaigns, icon: CheckCircle2 },
            { label: "Votes Open", value: s?.voting_active, icon: Vote },
            { label: "Milestones Approved", value: s?.approved_milestones, icon: Layers },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-black/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-mono font-semibold tabular-nums">{stat.value ?? "---"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Categories + Top Campaigns — two columns */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Categories breakdown */}
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

          {/* Top campaigns */}
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
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-6 mb-10">
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
        </motion.div>

        {/* Trust footer */}
        <motion.div variants={fadeUp} className="border border-black/[0.06] rounded-2xl p-6 bg-secondary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Every SOL is held in on-chain escrow</p>
              <p className="text-xs text-muted-foreground">
                No human can move funds — only community votes release milestones.
              </p>
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
        </motion.div>

      </motion.div>
    </div>
  );
}

// ─── Activity Row ───

const EVENT_CONFIG: Record<string, { icon: typeof Rocket; label: string; color: string }> = {
  campaign_launched: { icon: Rocket, label: "launched", color: "bg-amber-500" },
  submitted: { icon: ArrowUpRight, label: "evidence submitted for", color: "bg-blue-500" },
  voting_active: { icon: Vote, label: "vote opened on", color: "bg-purple-500" },
  approved: { icon: CheckCircle2, label: "milestone approved on", color: "bg-green-600" },
  rejected: { icon: CircleDot, label: "milestone rejected on", color: "bg-red-500" },
  extension_requested: { icon: Vote, label: "extension requested for", color: "bg-amber-600" },
};

function getEventConfig(event: any) {
  if (event.type === "campaign_launched") return EVENT_CONFIG.campaign_launched;
  if (event.to_state && EVENT_CONFIG[event.to_state]) return EVENT_CONFIG[event.to_state];
  return { icon: CircleDot, label: `${event.to_state || "updated"} on`, color: "bg-gray-400" };
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
