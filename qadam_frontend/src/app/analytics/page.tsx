"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getAnalyticsSummary } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { motion } from "framer-motion";
import { BarChart2, Users, TrendingUp, CheckCircle2, Zap, Target } from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: any = { visible: { transition: { staggerChildren: 0.08 } } };

export default function AnalyticsPage() {
  // Use dedicated summary endpoint (scalable)
  const { data: summaryData } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
    retry: false,
  });

  // Recent campaigns for the grid
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["analytics-recent"],
    queryFn: () => getCampaigns({ sort: "newest", limit: 6 }),
    retry: false,
  });

  const s = summaryData?.data;
  const campaigns = campaignsData?.data || [];

  const stats = [
    { icon: TrendingUp, label: "Total Raised", value: s ? formatSol(s.total_raised_lamports) : "---", sub: "across all campaigns" },
    { icon: BarChart2, label: "Campaigns", value: s ? s.total_campaigns : "---", sub: s ? `${s.active_campaigns} active` : "" },
    { icon: Users, label: "Backers", value: s ? s.total_backers.toLocaleString() : "---", sub: "unique positions" },
    { icon: CheckCircle2, label: "Completed", value: s ? s.completed_campaigns : "---", sub: "campaigns delivered" },
    { icon: Zap, label: "Governance", value: "On-chain", sub: "community voting" },
    { icon: Target, label: "Success Rate", value: s ? `${s.success_rate}%` : "---", sub: "campaigns completed" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Live platform statistics.</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="bg-white border border-black/[0.06] rounded-2xl p-5 hover:border-black/[0.10] transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums mb-0.5">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent campaigns */}
        <motion.div variants={fadeUp}>
          <h2 className="text-base font-semibold mb-4">Recent Campaigns</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No campaigns yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
