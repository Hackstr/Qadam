import { Badge } from "@/components/ui/badge";
import { formatSol } from "@/lib/constants";
import type { Milestone } from "@/types";
import { Check, Clock, AlertCircle, Loader2, Eye, X } from "lucide-react";

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-gray-400", label: "Pending" },
  grace_period: { icon: AlertCircle, color: "text-yellow-500", label: "Grace Period" },
  submitted: { icon: Loader2, color: "text-blue-500", label: "AI Verifying..." },
  ai_processing: { icon: Loader2, color: "text-blue-500", label: "AI Verifying..." },
  under_human_review: { icon: Eye, color: "text-purple-500", label: "Human Review" },
  approved: { icon: Check, color: "text-green-500", label: "Approved" },
  rejected: { icon: X, color: "text-red-500", label: "Rejected" },
  extension_requested: { icon: Clock, color: "text-yellow-500", label: "Extension Requested" },
  voting_active: { icon: AlertCircle, color: "text-yellow-500", label: "Voting Active" },
  extended: { icon: Clock, color: "text-blue-500", label: "Extended" },
  failed: { icon: X, color: "text-red-500", label: "Failed" },
};

export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone, idx) => {
        const config = statusConfig[milestone.status] || statusConfig.pending;
        const Icon = config.icon;
        const isLast = idx === milestones.length - 1;

        return (
          <div key={milestone.id} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">
                    {milestone.title || `Milestone ${milestone.index + 1}`}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatSol(milestone.amount_lamports)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
              </div>

              {milestone.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {milestone.description}
                </p>
              )}

              {milestone.ai_explanation && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium text-xs mb-1">AI Decision:</p>
                  <p className="text-muted-foreground">{milestone.ai_explanation}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Deadline: {new Date(milestone.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
