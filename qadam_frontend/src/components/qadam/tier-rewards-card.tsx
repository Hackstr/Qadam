import { Card, CardContent } from "@/components/ui/card";
import { TIER_1_MAX_BACKERS } from "@/lib/constants";
import { Crown, Star, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TierRewardsCardProps {
  backersCount: number;
  className?: string;
}

export function TierRewardsCard({ backersCount, className }: TierRewardsCardProps) {
  const foundersSpotsLeft = Math.max(0, TIER_1_MAX_BACKERS - backersCount);

  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-1">What you get as a backer</h3>
        <p className="text-xs text-muted-foreground mb-4">For every SOL you back, you earn ownership points. Earlier backers earn more.</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-semibold text-sm text-green-700">Founders</p>
                <p className="text-[10px] text-green-600">First 50 backers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-green-700">1.0 pts/SOL</p>
              <p className="text-[10px] text-green-600">{foundersSpotsLeft} of 50 left</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" />
              <div>
                <p className="font-semibold text-sm text-amber-700">Early Backers</p>
                <p className="text-[10px] text-amber-600">Backers 51–250</p>
              </div>
            </div>
            <p className="font-bold text-sm text-amber-700">0.67 pts/SOL</p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-semibold text-sm text-gray-600">Supporters</p>
                <p className="text-[10px] text-gray-500">Everyone after 250</p>
              </div>
            </div>
            <p className="font-bold text-sm text-gray-600">0.5 pts/SOL</p>
          </div>
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
