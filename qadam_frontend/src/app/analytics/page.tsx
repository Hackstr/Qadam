"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { formatSol } from "@/lib/constants";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { motion } from "framer-motion";
import { BarChart2, Users, TrendingUp, CheckCircle2, Zap } from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: any = { visible: { transition: { staggerChildren: 0.08 } } };

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-campaigns"],
    queryFn: () => getCampaigns({ status: undefined, limit: 50 }),
    retry: false,
  });

  const campaigns = data?.data || [];
  const active = campaigns.filter((c) => c.status === "active");
  const completed = campaigns.filter((c) => c.status === "completed");
  const totalGmvLamports = campaigns.reduce((sum, c) => sum + c.raised_lamports, 0);
  const totalBackers = campaigns.reduce((sum, c) => sum + c.backers_count, 0);
  const totalMilestonesApproved = campaigns.reduce((sum, c) => sum + c.milestones_approved, 0);
  const successRate = campaigns.length > 0
    ? Math.round((completed.length / campaigns.length) * 100)
    : 0;

  const stats = [
    { icon: TrendingUp, label: "Total GMV", value: formatSol(totalGmvLamports), sub: "across all campaigns" },
    { icon: BarChart2, label: "Campaigns", value: campaigns.length, sub: `${active.length} active · ${completed.length} completed` },
    { icon: Users, label: "Total Backers", value: totalBackers.toLocaleString(), sub: "unique positions" },
    { icon: CheckCircle2, label: "AI Approvals", value: totalMilestonesApproved, sub: "milestones released" },
    { icon: Zap, label: "Avg Verification", value: "< 60s", sub: "Claude AI decision time" },
    { icon: TrendingUp, label: "Success Rate", value: `${successRate}%`, sub: "campaigns completed" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Live platform statistics — how Qadam is growing.</p>
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
              {campaigns.slice(0, 6).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
