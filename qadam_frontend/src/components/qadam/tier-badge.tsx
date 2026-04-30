import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIER_LABELS } from "@/lib/constants";

export interface TierBadgeProps {
  tier: number;
  /** 'text' = colored span, 'badge' = Badge component with color + ratio */
  variant?: "text" | "badge";
  showRatio?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  variant = "text",
  showRatio = false,
  className,
}: TierBadgeProps) {
  const info = TIER_LABELS[tier as 1 | 2 | 3] || { name: `Tier ${tier}`, color: "text-gray-500", ratio: "", points: "" };

  if (variant === "badge") {
    return (
      <Badge className={cn(info.color, className)}>
        {info.name}
        {showRatio && ` (${info.ratio})`}
      </Badge>
    );
  }

  return (
    <span className={cn("text-xs font-medium", info.color, className)}>
      {info.name}
      {showRatio && ` (${info.ratio})`}
    </span>
  );
}
