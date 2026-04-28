import { Card, CardContent } from "@/components/ui/card";
import { Crown, Star, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_ICONS = [Crown, Star, UserCheck, Star, UserCheck];
const TIER_COLORS = [
  { bg: "bg-green-50", border: "border-green-100", text: "text-green-700", sub: "text-green-600", icon: "text-green-600" },
  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", sub: "text-amber-600", icon: "text-amber-600" },
  { bg: "bg-gray-50", border: "border-gray-100", text: "text-gray-600", sub: "text-gray-500", icon: "text-gray-500" },
  { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", sub: "text-blue-600", icon: "text-blue-600" },
  { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700", sub: "text-purple-600", icon: "text-purple-600" },
];

export interface TierRewardsCardProps {
  backersCount: number;
  tierConfig?: { name: string; multiplier: number; max_spots: number | null }[];
  className?: string;
}

export function TierRewardsCard({ backersCount, tierConfig, className }: TierRewardsCardProps) {
  // Default to standard 3-tier if no config provided
  const tiers = tierConfig && tierConfig.length > 0
    ? tierConfig
    : [
        { name: "Founders", multiplier: 1.0, max_spots: 50 },
        { name: "Early Backers", multiplier: 0.7, max_spots: 200 },
        { name: "Supporters", multiplier: 0.5, max_spots: null },
      ];

  // Compute spots remaining per tier
  let cumulativeSpots = 0;
  const tiersWithSpots = tiers.map((t, i) => {
    const spotsUsed = Math.max(0, Math.min(backersCount - cumulativeSpots, t.max_spots || Infinity));
    const spotsLeft = t.max_spots ? Math.max(0, t.max_spots - spotsUsed) : null;
    cumulativeSpots += t.max_spots || 0;
    return { ...t, spotsLeft, index: i };
  });

  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-1">What you get as a backer</h3>
        <p className="text-xs text-muted-foreground mb-4">For every SOL you back, you earn ownership points. Earlier backers earn more.</p>

        <div className="space-y-2">
          {tiersWithSpots.map((t) => {
            const colors = TIER_COLORS[t.index % TIER_COLORS.length];
            const Icon = TIER_ICONS[t.index % TIER_ICONS.length];
            const pctLabel = `${Math.round(t.multiplier * 100)}%`;

            return (
              <div key={t.index} className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colors.icon}`} />
                  <div>
                    <p className={`font-semibold text-sm ${colors.text}`}>{t.name}</p>
                    <p className={`text-[10px] ${colors.sub}`}>
                      {t.max_spots ? `${t.max_spots} spots` : "Unlimited"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${colors.text}`}>{pctLabel}</p>
                  {t.spotsLeft !== null && (
                    <p className={`text-[10px] ${colors.sub}`}>{t.spotsLeft} left</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>What are ownership points?</strong> Points give you a voting share in the project and a claim on tokens released as milestones are approved. 1 point = 1 vote.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
