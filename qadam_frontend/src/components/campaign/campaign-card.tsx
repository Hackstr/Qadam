import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatSol, formatPercent, TIER_LABELS, TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS } from "@/lib/constants";
import type { Campaign } from "@/types";
import { Users, Clock } from "lucide-react";

function getCurrentTier(backersCount: number): 1 | 2 | 3 {
  if (backersCount < TIER_1_MAX_BACKERS) return 1;
  if (backersCount < TIER_2_MAX_BACKERS) return 2;
  return 3;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-700",
  completed: "bg-blue-500/10 text-blue-700",
  refunded: "bg-red-500/10 text-red-700",
  draft: "bg-gray-500/10 text-gray-700",
  paused: "bg-yellow-500/10 text-yellow-700",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = getCurrentTier(campaign.backers_count);
  const tierInfo = TIER_LABELS[tier];

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        {campaign.cover_image_url && (
          <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
            <img
              src={campaign.cover_image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {campaign.title}
            </h3>
            <Badge className={statusColors[campaign.status] || ""} variant="secondary">
              {campaign.status}
            </Badge>
          </div>

          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {campaign.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{formatSol(campaign.raised_lamports)}</span>
              <span className="text-muted-foreground">of {formatSol(campaign.goal_lamports)}</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{campaign.backers_count} backers</span>
            </div>
            <span className={tierInfo.color}>
              {tierInfo.name} {tierInfo.ratio}
            </span>
          </div>

          {/* Milestones */}
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {campaign.milestones_approved}/{campaign.milestones_count} milestones
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
