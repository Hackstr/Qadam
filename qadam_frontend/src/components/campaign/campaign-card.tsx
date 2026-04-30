import Link from "next/link";
import { formatSol, formatPercent, getCurrentTier } from "@/lib/constants";
import type { Campaign } from "@/types";
import {
  Users, ArrowUpRight, Smartphone, Gamepad2, BarChart3, Wrench, Globe, Rocket,
  Cpu, HardDrive, Code, Palette, Music, Film, GraduationCap, Heart, Microscope, Leaf,
  type LucideIcon,
} from "lucide-react";
import { MilestoneDots } from "@/components/qadam/milestone-dots";
import { EscrowIndicator } from "@/components/qadam/escrow-indicator";
import { TierBadge } from "@/components/qadam/tier-badge";

const statusDot: Record<string, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  refunded: "bg-red-500",
  draft: "bg-gray-400",
  paused: "bg-yellow-500",
  cancelled: "bg-gray-400",
};

// Category covers — Foundation v1 + legacy
export const CATEGORY_COVERS: Record<string, { from: string; to: string; icon: LucideIcon }> = {
  // Foundation v1 categories
  Tech:             { from: "#0F172A", to: "#334155", icon: Cpu },
  Hardware:         { from: "#78350F", to: "#D97706", icon: HardDrive },
  Software:         { from: "#1E3A8A", to: "#3B82F6", icon: Code },
  "Art & Design":   { from: "#831843", to: "#EC4899", icon: Palette },
  Music:            { from: "#4C1D95", to: "#7C3AED", icon: Music },
  Film:             { from: "#1C1917", to: "#57534E", icon: Film },
  Education:        { from: "#164E63", to: "#06B6D4", icon: GraduationCap },
  Community:        { from: "#064E3B", to: "#34D399", icon: Heart },
  Research:         { from: "#1E3A5F", to: "#60A5FA", icon: Microscope },
  Climate:          { from: "#14532D", to: "#22C55E", icon: Leaf },
  // Legacy categories (backwards compat)
  Apps:             { from: "#1E3A8A", to: "#3B82F6", icon: Smartphone },
  Games:            { from: "#5B21B6", to: "#A855F7", icon: Gamepad2 },
  SaaS:             { from: "#065F46", to: "#10B981", icon: BarChart3 },
  Tools:            { from: "#92400E", to: "#F59E0B", icon: Wrench },
  Infrastructure:   { from: "#1E293B", to: "#475569", icon: Globe },
};
export const DEFAULT_COVER = { from: "#374151", to: "#6B7280", icon: Rocket };

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = getCurrentTier(campaign.backers_count);
  const cover = CATEGORY_COVERS[campaign.category || ""] || DEFAULT_COVER;
  const CoverIcon = cover.icon;

  // Compute urgency signals
  const daysLeft = campaign.funding_deadline
    ? Math.max(0, Math.ceil((new Date(campaign.funding_deadline).getTime() - Date.now()) / 86400000))
    : null;
  const endingSoon = daysLeft !== null && daysLeft <= 7 && campaign.status === "active";
  const hasActiveVote = (campaign.milestones || []).some(
    (m: any) => m?.status === "voting_active" || m?.status === "extension_requested"
  );

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <div className="relative bg-white border border-black/[0.06] rounded-2xl overflow-hidden hover:border-black/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 h-full flex flex-col">
        {/* Cover — image or category gradient with Lucide icon */}
        {campaign.cover_image_url ? (
          <div className="h-36 overflow-hidden">
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div
            className="h-36 flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
          >
            <CoverIcon className="h-10 w-10 text-white/80" />
            {/* Category label on cover */}
            <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-widest text-white/60">
              {campaign.category || "Project"}
            </span>
            {/* Status pills on cover */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {endingSoon && (
                <span className="bg-amber-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5">
                  {daysLeft}d left
                </span>
              )}
              {hasActiveVote && (
                <span className="bg-purple-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />Vote
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[campaign.status] || "bg-gray-400"}`} />
                <span className="text-[10px] text-white/80 capitalize">{campaign.status}</span>
              </div>
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

          {/* Creator */}
          {campaign.creator_display_name && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">
                {campaign.creator_display_name[0].toUpperCase()}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">by {campaign.creator_display_name}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-[12px] mb-1">
              <span className="font-semibold tabular-nums">{formatSol(campaign.raised_lamports)}</span>
              <div className="flex items-center gap-2">
                {daysLeft !== null && <span className="text-muted-foreground/60 tabular-nums">{daysLeft}d left</span>}
                <span className="text-muted-foreground/60">of {formatSol(campaign.goal_lamports)}</span>
              </div>
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
              <MilestoneDots
                total={campaign.milestones_count}
                approved={campaign.milestones_approved}
                variant="simple"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <EscrowIndicator
                variant="compact"
                solanaAddress={campaign.solana_pubkey}
                isDemo={campaign.solana_pubkey?.startsWith("demo_")}
              />
              <TierBadge tier={tier} variant="text" className="text-[11px]" />
            </div>
          </div>
        </div>

        {/* Hover indicator — bottom right to avoid status pill collision */}
        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-all" />
      </div>
    </Link>
  );
}
