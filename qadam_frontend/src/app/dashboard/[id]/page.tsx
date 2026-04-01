"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignUpdates, postCampaignUpdate } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatSol, formatPercent } from "@/lib/constants";
import { ArrowLeft, Send, Loader2, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function CampaignManagePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const campaign = data?.data;
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
      </div>
    );
  }

  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const nextMilestone = campaign.milestones?.find(
    (m) => m.status === "pending" || m.status === "grace_period" || m.status === "rejected" || m.status === "extended"
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Campaign header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{campaign.status}</Badge>
            {campaign.category && <Badge variant="outline">{campaign.category}</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
        </div>
        {nextMilestone && campaign.status === "active" && (
          <Link href={`/dashboard/${id}/submit`}>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Submit Evidence
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatSol(campaign.raised_lamports)}</p>
            <p className="text-xs text-muted-foreground">Raised</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{campaign.backers_count}</p>
            <p className="text-xs text-muted-foreground">Backers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{campaign.milestones_approved}/{campaign.milestones_count}</p>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{progress}%</p>
            <p className="text-xs text-muted-foreground">Funded</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>{formatSol(campaign.raised_lamports)} raised</span>
          <span className="text-muted-foreground">Goal: {formatSol(campaign.goal_lamports)}</span>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-3" />
      </div>

      {/* Milestone timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.milestones && campaign.milestones.length > 0 ? (
            <MilestoneTimeline milestones={campaign.milestones} />
          ) : (
            <p className="text-muted-foreground">No milestones</p>
          )}
        </CardContent>
      </Card>

      {/* Updates */}
      <UpdatesSection campaignId={id} />
    </div>
  );
}

function UpdatesSection({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data } = useQuery({
    queryKey: ["campaign-updates", campaignId],
    queryFn: () => getCampaignUpdates(campaignId),
  });

  const postMutation = useMutation({
    mutationFn: () => postCampaignUpdate(campaignId, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-updates", campaignId] });
      setTitle("");
      setContent("");
      toast.success("Update posted");
    },
    onError: () => toast.error("Failed to post update"),
  });

  const updates = data?.data || [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Campaign Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post form */}
        <div className="border border-black/[0.06] rounded-xl p-4 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title"
            maxLength={200}
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share progress with your backers..."
            rows={3}
          />
          <Button
            onClick={() => postMutation.mutate()}
            disabled={!title.trim() || !content.trim() || postMutation.isPending}
            size="sm"
          >
            Post Update
          </Button>
        </div>

        {/* Existing updates */}
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet. Keep your backers informed.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="border-l-2 border-amber-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">{update.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(update.inserted_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{update.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
