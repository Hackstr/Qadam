import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NextActionAlertProps {
  campaignId: string;
  milestoneNumber: number;
  className?: string;
}

export function NextActionAlert({ campaignId, milestoneNumber, className }: NextActionAlertProps) {
  return (
    <div className={cn("flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4", className)}>
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Next action</p>
          <p className="text-xs text-amber-700">
            Submit evidence for Milestone {milestoneNumber}
          </p>
        </div>
      </div>
      <Link href={`/dashboard/${campaignId}/submit`}>
        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
          <Send className="h-3.5 w-3.5" />
          Submit Evidence
        </Button>
      </Link>
    </div>
  );
}
