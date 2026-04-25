import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreatorStripProps {
  walletAddress: string;
  displayName?: string;
  location?: string;
  variant?: "compact" | "full";
  className?: string;
}

function truncateWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CreatorStrip({
  walletAddress,
  displayName,
  location,
  variant = "compact",
  className,
}: CreatorStripProps) {
  const initial = (displayName || walletAddress)[0].toUpperCase();
  const name = displayName || truncateWallet(walletAddress);

  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-3 bg-[#FAFAFA] rounded-xl p-3.5", className)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-[11px] text-muted-foreground">Creator{location ? ` · ${location}` : ""}</p>
        </div>
        <Link href={`/profile/${walletAddress}`}>
          <Button variant="outline" size="sm" className="rounded-full text-xs h-7">View profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("border-y border-black/[0.06]", className)}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/profile/${walletAddress}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">Creator · {location}</p>
          </div>
        </Link>
        <Link href={`/profile/${walletAddress}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          View profile <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
