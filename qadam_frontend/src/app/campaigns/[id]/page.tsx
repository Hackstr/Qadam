"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { getCampaign, getCampaignBackers, getCampaignUpdates } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { ShareButtons } from "@/components/social/share-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  formatSol, formatPercent, TIER_LABELS,
  TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS, SOLANA_NETWORK,
} from "@/lib/constants";
import {
  Users, Wallet, ArrowRight, Loader2, ArrowLeft,
  ExternalLink, Share2, Smartphone, Gamepad2,
  BarChart3, Wrench, Globe, Rocket,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Category covers — same as campaign-card
const CATEGORY_COVERS: Record<string, { from: string; to: string; icon: LucideIcon }> = {
  Apps:           { from: "#1E3A8A", to: "#3B82F6", icon: Smartphone },
  Games:          { from: "#5B21B6", to: "#A855F7", icon: Gamepad2 },
  SaaS:           { from: "#065F46", to: "#10B981", icon: BarChart3 },
  Tools:          { from: "#92400E", to: "#F59E0B", icon: Wrench },
  Infrastructure: { from: "#1E293B", to: "#475569", icon: Globe },
};
const DEFAULT_COVER = { from: "#374151", to: "#6B7280", icon: Rocket };

function getExplorerUrl(address: string) {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

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

  const { data: updatesData } = useQuery({
    queryKey: ["campaign-updates", id],
    queryFn: () => getCampaignUpdates(id),
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
        <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
        <Link href="/campaigns">
          <Button variant="outline">← Back to Discover</Button>
        </Link>
      </div>
    );
  }

  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = campaign.backers_count < TIER_1_MAX_BACKERS ? 1
    : campaign.backers_count < TIER_2_MAX_BACKERS ? 2 : 3;
  const tierInfo = TIER_LABELS[tier as 1 | 2 | 3];
  const backers = backersData?.data || [];
  const updates = updatesData?.data || [];
  const cover = CATEGORY_COVERS[campaign.category || ""] || DEFAULT_COVER;
  const CoverIcon = cover.icon;

  // Social share
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const tweetText = `Just found "${campaign.title}" on @QadamProtocol — AI-verified crowdfunding on Solana. SOL stays in escrow until milestones are proven. 🚀`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div>
      {/* Cover hero */}
      {campaign.cover_image_url ? (
        <div className="h-56 overflow-hidden">
          <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="h-48 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          <CoverIcon className="h-12 w-12 text-white/70" />
          <span className="absolute bottom-4 left-6 text-[11px] font-medium uppercase tracking-widest text-white/50">
            {campaign.category || "Project"}
          </span>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back nav */}
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-muted-foreground mt-3 leading-relaxed">{campaign.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Link
                  href={`/profile/${campaign.creator_wallet}`}
                  className="text-xs text-muted-foreground hover:text-amber-600 flex items-center gap-1 transition-colors"
                >
                  by{" "}
                  <span className="font-mono">
                    {campaign.creator_wallet.slice(0, 4)}...{campaign.creator_wallet.slice(-4)}
                  </span>
                </Link>
              </div>
              <ShareButtons title={campaign.title} description={campaign.description} />
            </div>

            <Separator />

            <Tabs defaultValue="milestones">
              <TabsList>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="backers">Backers ({campaign.backers_count})</TabsTrigger>
                <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
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
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </span>
                          <a
                            href={getExplorerUrl(backer.wallet_address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm hover:text-amber-600 transition-colors flex items-center gap-1"
                          >
                            {backer.wallet_address.slice(0, 4)}...{backer.wallet_address.slice(-4)}
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatSol(backer.amount_lamports)}</p>
                          <p className="text-xs text-muted-foreground">
                            Tier {backer.tier} · {backer.tokens_allocated.toLocaleString()} tokens
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="updates" className="mt-6">
                {updates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No updates yet from the creator.</p>
                ) : (
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <div key={update.id} className="border border-black/[0.06] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{update.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(update.inserted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {update.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-black/[0.06]">
              <CardContent className="p-6">
                {/* Amount */}
                <div className="mb-1">
                  <p className="text-3xl font-bold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
                  <p className="text-sm text-muted-foreground">raised of {formatSol(campaign.goal_lamports)} goal</p>
                </div>

                {/* Progress bar — thicker, more visible */}
                <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden my-4">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                  <div>
                    <p className="text-muted-foreground text-xs">Backers</p>
                    <p className="font-semibold flex items-center gap-1 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {campaign.backers_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Current Tier</p>
                    <p className={`font-semibold mt-0.5 ${tierInfo.color}`}>
                      {tierInfo.name} ({tierInfo.ratio})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Milestones</p>
                    <p className="font-semibold mt-0.5">{campaign.milestones_approved}/{campaign.milestones_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Platform fee</p>
                    <p className="font-semibold mt-0.5">2.5%</p>
                  </div>
                </div>

                {/* CTA */}
                {campaign.status === "active" ? (
                  <>
                    <Link href={`/campaigns/${campaign.id}/back`}>
                      <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                        <Wallet className="h-4 w-4" />
                        Back This Project
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    {campaign.tokens_per_lamport && (
                      <div className="mt-3 p-3 bg-zinc-50 rounded-lg text-xs text-muted-foreground">
                        <p>Back 1 SOL → receive{" "}
                          <strong className="text-foreground">
                            {campaign.tokens_per_lamport.toLocaleString()} tokens
                          </strong>
                        </p>
                        <p className="mt-0.5">
                          Current tier:{" "}
                          <span className={tierInfo.color}>{tierInfo.name} ({tierInfo.ratio})</span>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground capitalize">
                    Campaign is {campaign.status}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Token info */}
            {campaign.token_mint_address && (
              <Card className="border-black/[0.06]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Project Token</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {campaign.tokens_per_lamport && (
                    <div className="space-y-1.5 text-sm">
                      {[
                        { label: "Genesis (1.0x)", mult: 1 },
                        { label: "Early (0.67x)", mult: 0.67 },
                        { label: "Standard (0.5x)", mult: 0.5 },
                      ].map(({ label, mult }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium tabular-nums">
                            {Math.floor(campaign.tokens_per_lamport! * mult).toLocaleString()} / SOL
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] text-muted-foreground/60 truncate">
                      {campaign.token_mint_address}
                    </p>
                    <a
                      href={getExplorerUrl(campaign.token_mint_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-600 transition-colors" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Governance vote link */}
            <Link href={`/campaigns/${campaign.id}/vote`}>
              <div className="border border-black/[0.06] rounded-xl p-4 text-center hover:border-black/[0.12] transition-colors cursor-pointer">
                <p className="text-sm font-medium">Governance</p>
                <p className="text-xs text-muted-foreground mt-0.5">View or cast votes on milestone extensions</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
