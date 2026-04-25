import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MilestoneDotsProps {
  total: number;
  approved: number;
  /** 'simple' = dots only (no connecting lines), 'connected' = dots with lines */
  variant?: "simple" | "connected";
  /** 'sm' = for cards (3px dots), 'md' = for detail pages (5-6px dots) */
  size?: "sm" | "md";
  className?: string;
}

const dotSize = {
  sm: "w-3 h-3",
  md: "w-5 h-5",
} as const;

const checkSize = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
} as const;

export function MilestoneDots({
  total,
  approved,
  variant = "connected",
  size = "sm",
  className,
}: MilestoneDotsProps) {
  if (total <= 0) return null;

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < approved;
        return (
          <div key={i} className="flex items-center flex-1">
            <div
              className={cn(
                "rounded-full flex-shrink-0 flex items-center justify-center",
                dotSize[size],
                isDone ? "bg-green-500" : "bg-gray-200"
              )}
            >
              {isDone && (
                <Check className={cn("text-white", checkSize[size])} />
              )}
            </div>
            {variant === "connected" && i < total - 1 && (
              <div
                className={cn(
                  "flex-1",
                  size === "sm" ? "h-px" : "h-0.5",
                  isDone ? "bg-green-300" : "bg-gray-100"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
