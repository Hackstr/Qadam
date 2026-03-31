import Link from "next/link";
import { formatSol, formatPercent, TIER_LABELS, TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS } from "@/lib/constants";
import type { Campaign } from "@/types";
import { Users, CheckCircle2, Circle, ArrowUpRight } from "lucide-react";

function getCurrentTier(backersCount: number): 1 | 2 | 3 {
  if (backersCount < TIER_1_MAX_BACKERS) return 1;
  if (backersCount < TIER_2_MAX_BACKERS) return 2;
  return 3;
}

const statusDot: Record<string, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  refunded: "bg-red-500",
  draft: "bg-gray-400",
  paused: "bg-yellow-500",
  cancelled: "bg-gray-400",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = getCurrentTier(campaign.backers_count);
  const tierInfo = TIER_LABELS[tier];

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <div className="relative bg-white border border-black/[0.06] rounded-2xl p-5 hover:border-black/[0.12] hover:shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-all duration-200 h-full flex flex-col">
        {/* Category + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {campaign.category || "Project"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[campaign.status] || "bg-gray-400"}`} />
            <span className="text-xs text-muted-foreground capitalize">{campaign.status}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-amber-600 transition-colors line-clamp-2">
          {campaign.title}
        </h3>

        {campaign.description && (
          <p className="text-[13px] text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">
            {campaign.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[13px] mb-1.5">
            <span className="font-semibold tabular-nums">{formatSol(campaign.raised_lamports)}</span>
            <span className="text-muted-foreground">of {formatSol(campaign.goal_lamports)}</span>
          </div>
          <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {campaign.backers_count}
            </span>
            <span className="flex items-center gap-1">
              {/* Milestone dots */}
              {Array.from({ length: campaign.milestones_count }).map((_, i) => (
                i < campaign.milestones_approved
                  ? <CheckCircle2 key={i} className="h-3 w-3 text-green-500" />
                  : <Circle key={i} className="h-3 w-3 text-black/[0.12]" />
              ))}
            </span>
          </div>
          <span className={`text-[12px] font-medium ${tierInfo.color}`}>
            {tierInfo.name}
          </span>
        </div>

        {/* Hover arrow */}
        <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all" />
      </div>
    </Link>
  );
}
