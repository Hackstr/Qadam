import { Lock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSol, getExplorerUrl } from "@/lib/constants";

export interface EscrowIndicatorProps {
  /** 'compact' = small badge (Lock + "Escrow"), 'full' = green box with pulse + explorer link */
  variant?: "compact" | "full";
  solanaAddress?: string;
  amountLamports?: number;
  isDemo?: boolean;
  className?: string;
}

export function EscrowIndicator({
  variant = "compact",
  solanaAddress,
  amountLamports,
  isDemo = false,
  className,
}: EscrowIndicatorProps) {
  const hasRealAddress = solanaAddress && !isDemo;

  if (variant === "compact") {
    if (!hasRealAddress) return null;
    return (
      <span className={cn("flex items-center gap-0.5 text-[10px] text-green-600", className)}>
        <Lock className="h-2.5 w-2.5" />
        Escrow
      </span>
    );
  }

  // Full variant
  const text =
    amountLamports && amountLamports > 0
      ? `${formatSol(amountLamports)} locked in on-chain escrow`
      : "Funds go directly to on-chain escrow";

  if (hasRealAddress) {
    return (
      <a
        href={getExplorerUrl(solanaAddress)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-2 text-xs p-2.5 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors",
          className
        )}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-700">{text}</span>
        <ExternalLink className="h-3 w-3 ml-auto text-green-500" />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs p-2.5 bg-green-50 border border-green-100 rounded-lg",
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-green-700">Funds locked in smart contract</span>
    </div>
  );
}
