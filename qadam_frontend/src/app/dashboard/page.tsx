"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Send, CheckCircle2, ArrowRight, Rocket, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol } from "@/lib/constants";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { publicKey, connected } = useWallet();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-campaigns", publicKey?.toBase58()],
    queryFn: () => getCampaigns({ status: undefined }),
    enabled: connected && !!publicKey,
  });

  // Filter to only show campaigns created by this wallet
  const myCampaigns = (data?.data || []).filter(
    (c) => c.creator_wallet === publicKey?.toBase58()
  );

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <p className="text-muted-foreground">Connect your wallet to view your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {justCreated && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Campaign created successfully!</p>
              <p className="text-sm text-green-700">Share it with your community to attract backers.</p>
            </div>
          </div>
          {myCampaigns[0] && (
            <Link href={`/campaigns/${myCampaigns[0].id}`}>
              <Button size="sm" variant="outline" className="shrink-0 gap-1">
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your campaigns, submit evidence, track milestones.
          </p>
        </div>
        <Link href="/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Could not load campaigns.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Make sure the backend is running.</p>
        </div>
      ) : myCampaigns.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to launch your project?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Bring your idea to the community. Define milestones. Get funded as you deliver.
          </p>
          <Link href="/create">
            <Button className="gap-2 mt-6 bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4" />
              Create Your First Campaign
            </Button>
          </Link>
          <div className="mt-8 pt-8 border-t">
            <p className="text-xs text-muted-foreground">
              Connected: <span className="font-mono">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myCampaigns.map((campaign) => {
            // Compute next action
            const hasUnsubmitted = campaign.status === "active" && campaign.milestones_approved < campaign.milestones_count;
            const nextAction = hasUnsubmitted
              ? { text: `Submit evidence for Milestone ${campaign.milestones_approved + 1}`, href: `/dashboard/${campaign.id}/submit`, color: "text-amber-600" }
              : campaign.status === "completed"
              ? { text: "Campaign completed", href: `/campaigns/${campaign.id}`, color: "text-green-600" }
              : { text: `Campaign is ${campaign.status}`, href: `/campaigns/${campaign.id}`, color: "text-muted-foreground" };

            return (
              <Card key={campaign.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                        <h3 className="font-semibold truncate">{campaign.title}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{campaign.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {campaign.milestones_approved}/{campaign.milestones_count} milestones
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
                      <p className="text-xs text-muted-foreground">of {formatSol(campaign.goal_lamports)}</p>
                    </div>
                  </div>

                  {/* Next action */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <p className={`text-sm font-medium ${nextAction.color}`}>{nextAction.text}</p>
                    <Link href={nextAction.href}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        {hasUnsubmitted ? <Send className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {hasUnsubmitted ? "Submit" : "View"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {/* Add campaign button at bottom */}
          <Link href="/create">
            <Button variant="outline" className="w-full gap-2 mt-2">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
