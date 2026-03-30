"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviewQueue, decideMilestone } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";

export default function AdminReviewPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: getReviewQueue,
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      decideMilestone(id, approved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["review-queue"] }),
  });

  const milestones = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Admin Review Queue</h1>
      <p className="text-muted-foreground mb-8">
        Milestones flagged as PARTIAL by AI, awaiting human decision.
      </p>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No milestones pending review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {m.title || `Milestone ${(m.index || 0) + 1}`}
                  </CardTitle>
                  <Badge variant="secondary">Under Review</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {m.evidence_text && (
                  <div>
                    <p className="text-sm font-medium mb-1">Evidence:</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {m.evidence_text}
                    </p>
                  </div>
                )}

                {m.evidence_links && m.evidence_links.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Links:</p>
                    <ul className="text-sm space-y-1">
                      {m.evidence_links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline break-all"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {m.ai_explanation && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-sm font-medium mb-1">AI Assessment:</p>
                    <p className="text-sm">{m.ai_explanation}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => decideMutation.mutate({ id: m.id, approved: true })}
                    disabled={decideMutation.isPending}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    onClick={() => decideMutation.mutate({ id: m.id, approved: false })}
                    disabled={decideMutation.isPending}
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
