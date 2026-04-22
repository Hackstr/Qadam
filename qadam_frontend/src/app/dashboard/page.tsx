"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import { getCampaigns, getMe } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol, formatPercent } from "@/lib/constants";
import {
  Loader2, Plus, Send, CheckCircle2, ArrowRight, Rocket, Eye,
  BarChart2, Share2, ExternalLink, PenLine, Clock,
} from "lucide-react";
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

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: connected,
    retry: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-campaigns", publicKey?.toBase58()],
    queryFn: () => getCampaigns({ status: undefined }),
    enabled: connected && !!publicKey,
  });

  const myCampaigns = (data?.data || []).filter(
    (c) => c.creator_wallet === publicKey?.toBase58()
  );

  const displayName = userData?.data?.display_name;

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <p className="text-muted-foreground">Connect your wallet to view your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Created banner */}
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

      {/* Header — personalized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {displayName ? `Welcome back, ${displayName}` : "My Campaigns"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {myCampaigns.length > 0
              ? "Here's what's happening with your campaigns."
              : "Create your first campaign and start building."
            }
          </p>
        </div>
        <Link href="/create">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6">
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
        </div>
      ) : myCampaigns.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <Rocket className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Ready to launch?</h3>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Bring your idea to the community. Define milestones. Get funded as you deliver real progress.
          </p>
          <Link href="/create">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8" size="lg">
              <Plus className="h-4 w-4" />
              Create Your First Campaign
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-8">
            Connected: <span className="font-mono">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myCampaigns.map((campaign) => {
            const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
            const hasUnsubmitted = campaign.status === "active" && campaign.milestones_approved < campaign.milestones_count;
            const daysText = ""; // TODO: compute from milestone deadline

            return (
              <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow border-black/[0.06]">
                <CardContent className="p-0">
                  {/* Campaign header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${
                            campaign.status === "active" ? "bg-green-50 text-green-700" :
                            campaign.status === "completed" ? "bg-blue-50 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{campaign.status}</Badge>
                        </div>
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                          <h2 className="text-xl font-bold">{campaign.title}</h2>
                        </Link>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
                        <p className="text-xs text-muted-foreground">of {formatSol(campaign.goal_lamports)} goal</p>
                      </div>
                    </div>

                    {/* Milestone path — dots with lines */}
                    <div className="mt-4 flex items-center gap-0">
                      {Array.from({ length: campaign.milestones_count }).map((_, i) => {
                        const isDone = i < campaign.milestones_approved;
                        const isCurrent = i === campaign.milestones_approved;
                        return (
                          <div key={i} className="flex items-center flex-1">
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                              isDone ? "bg-green-500 border-green-500" :
                              isCurrent ? "bg-amber-500 border-amber-500" :
                              "bg-white border-gray-200"
                            }`}>
                              {isDone && <CheckCircle2 className="h-3 w-3 text-white m-auto" />}
                            </div>
                            {i < campaign.milestones_count - 1 && (
                              <div className={`flex-1 h-0.5 ${isDone ? "bg-green-300" : "bg-gray-100"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {campaign.milestones_approved} of {campaign.milestones_count} milestones complete · {progress}% funded · {campaign.backers_count} backers
                    </p>
                  </div>

                  {/* Next action — prominent */}
                  {hasUnsubmitted && (
                    <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Next action</p>
                          <p className="text-xs text-amber-700">
                            Submit evidence for Milestone {campaign.milestones_approved + 1}
                          </p>
                        </div>
                      </div>
                      <Link href={`/dashboard/${campaign.id}/submit`}>
                        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                          <Send className="h-3.5 w-3.5" />
                          Submit Evidence
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="px-6 pb-5 flex items-center gap-3 flex-wrap">
                    <Link href={`/dashboard/${campaign.id}/update`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
                        <PenLine className="h-3 w-3" /> Post Update
                      </Button>
                    </Link>
                    <Link href={`/dashboard/${campaign.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
                        <PenLine className="h-3 w-3" /> Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/${campaign.id}/analytics`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
                        <BarChart2 className="h-3 w-3" /> Analytics
                      </Button>
                    </Link>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
                        <ExternalLink className="h-3 w-3" /> View Public
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs rounded-full"
                      onClick={() => {
                        const url = `${window.location.origin}/campaigns/${campaign.id}`;
                        navigator.clipboard.writeText(url);
                        import("sonner").then(({ toast }) => toast.success("Link copied!"));
                      }}
                    >
                      <Share2 className="h-3 w-3" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add campaign */}
          <Link href="/create">
            <Button variant="outline" className="w-full gap-2 rounded-full border-dashed border-2 py-6 text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" /> Create Another Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
