import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/lib/constants";
import type { Milestone } from "@/types";
import { Check, Clock, AlertCircle, Loader2, Eye, X, Scale } from "lucide-react";

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-gray-400", label: "Pending" },
  grace_period: { icon: AlertCircle, color: "text-yellow-500", label: "Grace Period" },
  submitted: { icon: Loader2, color: "text-blue-500", label: "Submitted" },
  ai_processing: { icon: Loader2, color: "text-blue-500", label: "Processing..." },
  under_human_review: { icon: Eye, color: "text-purple-500", label: "Human Review" },
  approved: { icon: Check, color: "text-green-500", label: "Approved" },
  rejected: { icon: X, color: "text-red-500", label: "Rejected" },
  extension_requested: { icon: Clock, color: "text-yellow-500", label: "Extension Requested" },
  voting_active: { icon: AlertCircle, color: "text-yellow-500", label: "Voting Active" },
  extended: { icon: Clock, color: "text-blue-500", label: "Extended" },
  failed: { icon: X, color: "text-red-500", label: "Failed" },
};

interface MilestoneTimelineProps {
  milestones: Milestone[];
  showAppeal?: boolean;
  onAppeal?: (milestoneId: string) => void;
}

export function MilestoneTimeline({ milestones, showAppeal, onAppeal }: MilestoneTimelineProps) {
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

              {milestone.acceptance_criteria && (
                <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                  <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Acceptance criteria
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {milestone.acceptance_criteria}
                  </p>
                </div>
              )}

              {milestone.ai_explanation && (
                <div className={`mt-2 p-3 rounded-lg text-sm border ${
                  milestone.status === "approved"
                    ? "bg-green-50/50 border-green-100"
                    : milestone.status === "rejected"
                    ? "bg-red-50/50 border-red-100"
                    : "bg-purple-50/50 border-purple-100"
                }`}>
                  <p className="font-medium text-xs mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Verification: {milestone.status === "approved" ? "Approved" : milestone.status === "rejected" ? "Rejected" : "Under Review"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{milestone.ai_explanation}</p>
                </div>
              )}

              {/* Action buttons for creator view */}
              {showAppeal && milestone.status === "rejected" && onAppeal && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => onAppeal(milestone.id)}
                  >
                    <Scale className="h-3.5 w-3.5" />
                    Request Extension
                  </Button>
                </div>
              )}

              {(() => {
                const active = ["pending", "grace_period", "extended", "submitted", "ai_processing"].includes(milestone.status);
                const diff = Math.ceil((new Date(milestone.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const countdown = diff < 0
                  ? { text: `Overdue by ${Math.abs(diff)} days`, color: "text-red-500" }
                  : diff === 0
                  ? { text: "Due today", color: "text-red-500" }
                  : diff <= 7
                  ? { text: `${diff} days left`, color: "text-amber-500" }
                  : { text: `${diff} days left`, color: "text-muted-foreground" };
                return (
                  <p className={`text-xs mt-2 ${active ? countdown.color : "text-muted-foreground"}`}>
                    {active ? `${countdown.text} · ` : ""}
                    {new Date(milestone.deadline).toLocaleDateString()}
                  </p>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
