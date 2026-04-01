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

// Category-based gradient covers when no image
const categoryGradient: Record<string, string> = {
  Apps: "from-blue-600 to-indigo-900",
  Games: "from-purple-600 to-fuchsia-900",
  SaaS: "from-emerald-600 to-teal-900",
  Tools: "from-orange-500 to-red-800",
  Infrastructure: "from-slate-600 to-zinc-900",
};

// Category icons (emoji as simple visual)
const categoryEmoji: Record<string, string> = {
  Apps: "📱",
  Games: "🎮",
  SaaS: "📊",
  Tools: "🔧",
  Infrastructure: "🌐",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = getCurrentTier(campaign.backers_count);
  const tierInfo = TIER_LABELS[tier];
  const gradient = categoryGradient[campaign.category || ""] || "from-gray-600 to-gray-900";
  const emoji = categoryEmoji[campaign.category || ""] || "🚀";

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <div className="relative bg-white border border-black/[0.06] rounded-2xl overflow-hidden hover:border-black/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 h-full flex flex-col">
        {/* Cover — image or gradient */}
        {campaign.cover_image_url ? (
          <div className="h-32 overflow-hidden">
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            <span className="text-4xl opacity-60">{emoji}</span>
            {/* Category label on cover */}
            <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-widest text-white/70">
              {campaign.category || "Project"}
            </span>
            {/* Status pill on cover */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[campaign.status] || "bg-gray-400"}`} />
              <span className="text-[10px] text-white/80 capitalize">{campaign.status}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-semibold text-[15px] leading-snug mb-1 group-hover:text-amber-600 transition-colors line-clamp-2">
            {campaign.title}
          </h3>

          {campaign.description && (
            <p className="text-[12px] text-muted-foreground/70 line-clamp-2 mb-3 leading-relaxed">
              {campaign.description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-semibold tabular-nums">{formatSol(campaign.raised_lamports)}</span>
              <span className="text-muted-foreground/60">of {formatSol(campaign.goal_lamports)}</span>
            </div>
            <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04]">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {campaign.backers_count}
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: campaign.milestones_count }).map((_, i) => (
                  i < campaign.milestones_approved
                    ? <CheckCircle2 key={i} className="h-2.5 w-2.5 text-green-500" />
                    : <Circle key={i} className="h-2.5 w-2.5 text-black/[0.10]" />
                ))}
              </span>
            </div>
            <span className={`text-[11px] font-medium ${tierInfo.color}`}>
              {tierInfo.name}
            </span>
          </div>
        </div>

        {/* Hover arrow */}
        <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-white/0 group-hover:text-white/60 transition-all" />
      </div>
    </Link>
  );
}
