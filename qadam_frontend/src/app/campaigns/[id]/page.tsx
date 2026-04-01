"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getCampaign, getCampaignBackers } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatSol, formatPercent, TIER_LABELS, TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS } from "@/lib/constants";
import { Users, Wallet, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const { data: backersData } = useQuery({
    queryKey: ["campaign-backers", id],
    queryFn: () => getCampaignBackers(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const campaign = campaignData?.data;
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
      </div>
    );
  }

  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = campaign.backers_count < TIER_1_MAX_BACKERS ? 1 : campaign.backers_count < TIER_2_MAX_BACKERS ? 2 : 3;
  const tierInfo = TIER_LABELS[tier as 1 | 2 | 3];
  const backers = backersData?.data || [];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary">{campaign.status}</Badge>
              {campaign.category && <Badge variant="outline">{campaign.category}</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            {campaign.description && (
              <p className="text-muted-foreground mt-3">{campaign.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              by{" "}
              <span className="font-mono text-xs">
                {campaign.creator_wallet.slice(0, 4)}...{campaign.creator_wallet.slice(-4)}
              </span>
            </p>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="milestones">
            <TabsList>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="backers">Backers ({campaign.backers_count})</TabsTrigger>
            </TabsList>

            <TabsContent value="milestones" className="mt-6">
              {campaign.milestones && campaign.milestones.length > 0 ? (
                <MilestoneTimeline milestones={campaign.milestones} />
              ) : (
                <p className="text-muted-foreground">No milestones yet</p>
              )}
            </TabsContent>

            <TabsContent value="backers" className="mt-6">
              {backers.length === 0 ? (
                <p className="text-muted-foreground">No backers yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {backers.map((backer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </div>
                        <span className="font-mono text-sm">
                          {backer.wallet_address.slice(0, 4)}...{backer.wallet_address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatSol(backer.amount_lamports)}</p>
                        <p className="text-xs text-muted-foreground">
                          Tier {backer.tier} &middot; {backer.tokens_allocated.toLocaleString()} tokens
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding card */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-3xl font-bold">{formatSol(campaign.raised_lamports)}</p>
                <p className="text-sm text-muted-foreground">
                  raised of {formatSol(campaign.goal_lamports)} goal
                </p>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-3 mb-4" />
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-muted-foreground">Backers</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {campaign.backers_count}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Tier</p>
                  <p className={`font-semibold ${tierInfo.color}`}>
                    {tierInfo.name} ({tierInfo.ratio})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Milestones</p>
                  <p className="font-semibold">
                    {campaign.milestones_approved}/{campaign.milestones_count}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fee</p>
                  <p className="font-semibold">2.5%</p>
                </div>
              </div>

              {campaign.status === "active" && (
                <>
                  <Link href={`/campaigns/${campaign.id}/back`}>
                    <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                      <Wallet className="h-4 w-4" />
                      Back This Project
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  {/* Token preview */}
                  {campaign.tokens_per_lamport && (
                    <div className="mt-3 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                      <p>Back 1 SOL &rarr; receive <strong className="text-foreground">{(campaign.tokens_per_lamport).toLocaleString()} tokens</strong></p>
                      <p className="mt-0.5">Current tier: <span className={tierInfo.color}>{tierInfo.name} ({tierInfo.ratio})</span></p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Token info */}
          {campaign.token_mint_address && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Project Token</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {campaign.tokens_per_lamport && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Genesis (1.0x)</span>
                      <span className="font-medium">{(campaign.tokens_per_lamport).toLocaleString()} / SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Early (0.67x)</span>
                      <span className="font-medium">{Math.floor(campaign.tokens_per_lamport * 0.67).toLocaleString()} / SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standard (0.5x)</span>
                      <span className="font-medium">{Math.floor(campaign.tokens_per_lamport * 0.5).toLocaleString()} / SOL</span>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="font-mono text-[10px] break-all text-muted-foreground/60">
                    {campaign.token_mint_address}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
