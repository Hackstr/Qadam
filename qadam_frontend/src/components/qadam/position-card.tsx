"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MilestoneDots } from "./milestone-dots";
import { TierBadge } from "./tier-badge";
import { formatSol, TIER_LABELS } from "@/lib/constants";
import { Vote, Gift, RotateCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PositionCardProps {
  position: any;
  onClaimTokens?: (pubkey: string, wallet: string, tokensAllocated: number) => void;
  onClaimRefund?: (pubkey: string, wallet: string) => void;
  txBusy?: boolean;
  className?: string;
}

export function PositionCard({ position: pos, onClaimTokens, onClaimRefund, txBusy, className }: PositionCardProps) {
  const msCount = pos.milestones_count || 0;
  const msApproved = pos.milestones_approved || 0;
  const hasUnclaimedTokens = pos.tokens_claimed < pos.tokens_allocated;
  const canRefund = pos.campaign_status === "refunded" && !pos.refund_claimed;
  const needsVote = pos.has_active_vote === true;

  return (
    <Card className={cn("hover:shadow-sm transition-shadow border-black/[0.06]", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/campaigns/${pos.campaign_id}`} className="hover:underline">
              <h3 className="font-semibold">{pos.campaign_title || "Campaign"}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{pos.campaign_status}</Badge>
              <TierBadge tier={pos.tier as 1 | 2 | 3} variant="text" />
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{pos.tokens_claimed.toLocaleString()} / {pos.tokens_allocated.toLocaleString()} share</span>
            </div>

            {msCount > 0 && (
              <MilestoneDots
                total={msCount}
                approved={msApproved}
                variant="connected"
                size="sm"
                className="mt-3"
              />
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-bold tabular-nums">{formatSol(pos.amount_lamports)}</p>
          </div>
        </div>

        {(hasUnclaimedTokens || canRefund || needsVote) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
            {needsVote && (
              <Link href={`/campaigns/${pos.campaign_id}/vote`}>
                <Button size="sm" className="gap-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
                  <Vote className="h-3 w-3" /> Vote on milestone
                </Button>
              </Link>
            )}
            {hasUnclaimedTokens && pos.campaign_status !== "refunded" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full text-xs"
                disabled={txBusy}
                onClick={() => {
                  const pubkey = pos.campaign_pubkey || pos.campaign_id;
                  onClaimTokens?.(pubkey, pos.wallet_address, pos.tokens_allocated);
                }}
              >
                <Gift className="h-3 w-3" /> Claim Share
              </Button>
            )}
            {canRefund && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 rounded-full text-xs"
                disabled={txBusy}
                onClick={() => {
                  const pubkey = pos.campaign_pubkey || pos.campaign_id;
                  onClaimRefund?.(pubkey, pos.wallet_address);
                }}
              >
                <RotateCcw className="h-3 w-3" /> Claim Refund
              </Button>
            )}
            <Link href={`/campaigns/${pos.campaign_id}`}>
              <Button size="sm" variant="ghost" className="gap-1 text-xs">
                <ExternalLink className="h-3 w-3" /> View Campaign
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
