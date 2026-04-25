import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatItem {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string;
  valueColor?: string;
  sublabel?: string;
}

export interface StatsGridProps {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ items, columns = 4, className }: StatsGridProps) {
  const gridCols = columns === 2 ? "md:grid-cols-2" : columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  return (
    <div className={cn(`grid grid-cols-2 ${gridCols} gap-4`, className)}>
      {items.map((item) => (
        <Card key={item.label} className="border-black/[0.06]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={cn("h-4 w-4", item.iconColor || "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums", item.valueColor)}>{item.value}</p>
            {item.sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{item.sublabel}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
