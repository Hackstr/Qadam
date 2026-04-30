import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowIndicator } from "./escrow-indicator";
import {
  formatSol, formatPercent, getCurrentTier,
  TIER_1_MAX_BACKERS, QADAM_FEE_BPS,
} from "@/lib/constants";
import { Wallet, ArrowRight, Crown } from "lucide-react";
import type { Campaign } from "@/types";
import { cn } from "@/lib/utils";

export interface FundingCardProps {
  campaign: Campaign;
  className?: string;
}

export function FundingCard({ campaign, className }: FundingCardProps) {
  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = getCurrentTier(campaign.backers_count, campaign.tier_config);
  const foundersSpotsLeft = Math.max(0, TIER_1_MAX_BACKERS - campaign.backers_count);

  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-1">
          <p className="text-3xl font-bold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
          {progress >= 100 && <Badge className="bg-green-50 text-green-700 text-xs">Funded</Badge>}
          {progress > 0 && progress < 100 && <Badge className="bg-amber-50 text-amber-700 text-xs">{progress}% funded</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mb-3">raised of {formatSol(campaign.goal_lamports)} goal</p>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>

        <EscrowIndicator
          variant="full"
          solanaAddress={campaign.solana_pubkey}
          amountLamports={campaign.raised_lamports}
          isDemo={campaign.solana_pubkey?.startsWith("demo_")}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-3 text-center mb-5">
          <div>
            <p className="text-lg font-bold tabular-nums">{campaign.backers_count}</p>
            <p className="text-[10px] text-muted-foreground">backers</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{campaign.milestones_approved}/{campaign.milestones_count}</p>
            <p className="text-[10px] text-muted-foreground">milestones</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{(QADAM_FEE_BPS / 100).toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">platform fee</p>
          </div>
        </div>

        {campaign.status === "active" && (
          <Link href={`/campaigns/${campaign.id}/back`}>
            <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full" size="lg">
              <Wallet className="h-4 w-4" /> Back This Project <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {tier === 1 && foundersSpotsLeft > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span><strong>{foundersSpotsLeft} Founders spots left</strong> — back now for the full 1.0 points/SOL</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
