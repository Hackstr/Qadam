import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActiveVoteWidgetProps {
  campaignId: string;
  milestone: {
    index: number;
    title?: string;
    extension_deadline?: string;
    votes_approve_percent?: number | null;
    votes_count?: number;
  };
  className?: string;
}

export function ActiveVoteWidget({ campaignId, milestone, className }: ActiveVoteWidgetProps) {
  const daysLeft = milestone.extension_deadline
    ? Math.ceil((new Date(milestone.extension_deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Card className={cn("border-purple-200 bg-purple-50/30", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <p className="text-sm font-semibold text-purple-700">Community is voting</p>
          </div>
          {daysLeft != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {daysLeft}d left
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Milestone {milestone.index + 1}: {milestone.title || "Untitled"}
        </p>
        {milestone.votes_approve_percent != null && (
          <div className="mb-3">
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${milestone.votes_approve_percent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {milestone.votes_approve_percent}% YES · {milestone.votes_count || 0} votes
            </p>
          </div>
        )}
        <Link href={`/campaigns/${campaignId}/vote`}>
          <Button size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
            <Vote className="h-3.5 w-3.5" /> Cast your vote
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
