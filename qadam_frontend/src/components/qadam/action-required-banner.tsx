import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Vote, Gift, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  text: string;
  href: string;
  type: "vote" | "claim" | "refund";
}

export interface ActionRequiredBannerProps {
  actions: ActionItem[];
  maxVisible?: number;
  className?: string;
}

const actionConfig = {
  vote: { icon: Vote, iconColor: "text-purple-500", btnColor: "bg-purple-600 hover:bg-purple-700", label: "Cast vote" },
  claim: { icon: Gift, iconColor: "text-green-500", btnColor: "bg-green-600 hover:bg-green-700", label: "Claim" },
  refund: { icon: RotateCcw, iconColor: "text-red-400", btnColor: "bg-red-500 hover:bg-red-600", label: "Refund" },
} as const;

export function ActionRequiredBanner({ actions, maxVisible = 5, className }: ActionRequiredBannerProps) {
  if (actions.length === 0) return null;

  return (
    <Card className={cn("border-amber-200 bg-amber-50/50", className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">Action required ({actions.length})</p>
        </div>
        <div className="space-y-2">
          {actions.slice(0, maxVisible).map((a, i) => {
            const config = actionConfig[a.type];
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 p-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                  <span className="text-sm">{a.text}</span>
                </div>
                <Link href={a.href}>
                  <Button size="sm" className={cn("rounded-full text-xs gap-1 text-white", config.btnColor)}>
                    {config.label}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
