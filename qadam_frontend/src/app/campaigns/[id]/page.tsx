"use client";

import { useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getCampaign, getCampaignBackers, getCampaignUpdates } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { ShareButtons } from "@/components/social/share-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  formatSol, formatPercent, TIER_LABELS,
  TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS, SOLANA_NETWORK,
} from "@/lib/constants";
import {
  Users, Wallet, ArrowRight, Loader2, ArrowLeft,
  ExternalLink, Share2, Smartphone, Gamepad2,
  BarChart3, Wrench, Globe, Rocket, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
  return (
    <Suspense>
      <CampaignDetailContent />
    </Suspense>
  );
}

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

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

  const campaign = campaignData?.data;

  useEffect(() => {
    if (campaign?.title) {
      document.title = `${campaign.title} | Qadam`;
    }
    return () => { document.title = "Qadam — Build step by step"; };
  }, [campaign?.title]);

  useEffect(() => {
    if (isNew && campaign) {
      const url = `${window.location.origin}/campaigns/${id}`;
      toast.success("Campaign is live on Solana!", {
        description: "Share it to get your first backers",
        duration: 10000,
        action: {
          label: "Copy link",
          onClick: () => {
            navigator.clipboard.writeText(url);
            toast.success("Link copied!");
          },
        },
      });
    }
  }, [isNew, campaign, id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
  const tweetText = `Just found "${campaign.title}" on @QadamProtocol — community-governed crowdfunding on Solana. SOL stays in escrow until backers approve each milestone.`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div>
      {/* Cover hero */}
      {campaign.cover_image_url ? (
        <div className="h-56 overflow-hidden">
          <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-full object-cover object-[center_80%]" />
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

              {/* Creator info */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <Link
                  href={`/profile/${campaign.creator_wallet}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-600 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(campaign.creator_display_name || campaign.creator_wallet)[0].toUpperCase()}
                  </div>
                  <span className={campaign.creator_display_name ? "font-medium" : "font-mono text-xs"}>
                    {campaign.creator_display_name || `${campaign.creator_wallet.slice(0, 6)}...${campaign.creator_wallet.slice(-4)}`}
                  </span>
                </Link>
                {campaign.category && (
                  <Badge variant="secondary" className="text-xs">{campaign.category}</Badge>
                )}
              </div>

              <ShareButtons title={campaign.title} description={campaign.description} />

              {campaign.pitch_video_url && (() => {
                const url = campaign.pitch_video_url!;
                const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
                if (ytMatch) {
                  return (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border">
                      <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  );
                }
                if (loomMatch) {
                  return (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border">
                      <iframe src={`https://www.loom.com/embed/${loomMatch[1]}`} className="w-full h-full" allowFullScreen />
                    </div>
                  );
                }
                return (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:underline">
                    Watch pitch video <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                );
              })()}
            </div>

            <Separator />

            <Tabs defaultValue="about">
              <TabsList className="flex-wrap">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
                <TabsTrigger value="backers">Backers ({campaign.backers_count})</TabsTrigger>
                {campaign.faq && campaign.faq.length > 0 && (
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                )}
              </TabsList>

              {/* About tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {campaign.description && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
                  </div>
                )}

                {/* Risks & Challenges */}
                {campaign.risks && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Risks & Challenges
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.risks}</p>
                  </div>
                )}

                {!campaign.description && !campaign.risks && (
                  <p className="text-muted-foreground">No description provided yet.</p>
                )}
              </TabsContent>

              {/* Milestones tab */}
              <TabsContent value="milestones" className="mt-6">
                {campaign.milestones && campaign.milestones.length > 0 ? (
                  <MilestoneTimeline milestones={campaign.milestones} />
                ) : (
                  <p className="text-muted-foreground">No milestones yet</p>
                )}
              </TabsContent>

              {/* Backers tab */}
              <TabsContent value="backers" className="mt-6">
                {backers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>No backers yet. Be the first!</p>
                  </div>
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
                            Tier {backer.tier} · {backer.tokens_allocated.toLocaleString()} share
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Updates tab */}
              <TabsContent value="updates" className="mt-6">
                {updates.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">No updates yet from the creator.</p>
                  </div>
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

              {/* FAQ tab */}
              {campaign.faq && campaign.faq.length > 0 && (
                <TabsContent value="faq" className="mt-6">
                  <div className="space-y-3">
                    {campaign.faq.map((item: { q: string; a: string }, i: number) => (
                      <div key={i} className="border border-black/[0.06] rounded-xl p-4">
                        <p className="font-medium text-sm">{item.q}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
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

                {/* Escrow trust indicator */}
                {campaign.solana_pubkey && !campaign.solana_pubkey.startsWith("demo_") ? (
                  <a
                    href={getExplorerUrl(campaign.solana_pubkey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-amber-600 transition-colors mb-4 p-2.5 bg-green-50/50 border border-green-100/50 rounded-lg"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                    <span>
                      {campaign.raised_lamports > 0
                        ? `${formatSol(campaign.raised_lamports)} locked in escrow`
                        : "Funds go directly to on-chain escrow"
                      }
                    </span>
                    <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 p-2.5 bg-green-50/50 border border-green-100/50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span>Funds locked in smart contract until milestones verified</span>
                  </div>
                )}

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
                    <div className="mt-3 p-3 bg-zinc-50 rounded-lg text-xs text-muted-foreground">
                      <p>
                        Current tier:{" "}
                        <span className={tierInfo.color}>{tierInfo.name} ({tierInfo.ratio})</span>
                      </p>
                      <p className="mt-0.5">Early backers earn a higher share of the project.</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground capitalize">
                    Campaign is {campaign.status}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active vote widget */}
            {(() => {
              const votingMs = (campaign.milestones || []).find(
                (m: any) => m.status === "voting_active" || m.status === "extension_requested" || m.status === "submitted"
              );
              if (!votingMs) return null;
              return (
                <Card className="border-purple-200 bg-purple-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <p className="text-sm font-semibold text-purple-700">
                        {votingMs.status === "submitted" ? "Evidence Submitted" : "Community is Voting"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Milestone {votingMs.index + 1}: {votingMs.title || "Untitled"}
                    </p>
                    <Link href={`/campaigns/${campaign.id}/vote`}>
                      <Button size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
                        Cast Your Vote
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Backer tiers */}
            <Card className="border-black/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Backer Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium text-green-700">Genesis</p>
                      <p className="text-xs text-green-600">First 50 backers</p>
                    </div>
                    <span className="font-semibold text-green-700">1.0x share</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50">
                    <div>
                      <p className="font-medium text-amber-700">Early</p>
                      <p className="text-xs text-amber-600">Backers 51-250</p>
                    </div>
                    <span className="font-semibold text-amber-700">0.67x share</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-600">Standard</p>
                      <p className="text-xs text-gray-500">251+</p>
                    </div>
                    <span className="font-semibold text-gray-600">0.5x share</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Your share gives you governance rights — vote on deadline extensions and refunds.
                </p>
                </CardContent>
              </Card>

            {/* Governance vote link */}
            <Link href={`/campaigns/${campaign.id}/vote`}>
              <div className="border border-black/[0.06] rounded-xl p-4 text-center hover:border-black/[0.12] transition-colors cursor-pointer">
                <p className="text-sm font-medium">Governance</p>
                <p className="text-xs text-muted-foreground mt-0.5">View or cast votes on milestone extensions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Similar campaigns */}
        <SimilarCampaigns currentId={campaign.id} category={campaign.category} />
      </div>
    </div>
  );
}

function SimilarCampaigns({ currentId, category }: { currentId: string; category?: string }) {
  const { data } = useQuery({
    queryKey: ["similar-campaigns", category],
    queryFn: () => getCampaign(""), // reuse campaigns list
    enabled: false, // disabled — we'll use a simpler approach
  });

  // Simple approach: fetch from campaigns list API
  const { data: listData } = useQuery({
    queryKey: ["campaigns-for-similar"],
    queryFn: async () => {
      const { getCampaigns } = await import("@/lib/api");
      return getCampaigns({ limit: 4 });
    },
  });

  const similar = (listData?.data || []).filter((c: any) => c.id !== currentId).slice(0, 3);
  if (similar.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-semibold mb-4">Other campaigns</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {similar.map((c: any) => (
          <Link key={c.id} href={`/campaigns/${c.id}`} className="border border-black/[0.06] rounded-xl p-4 hover:border-black/[0.12] transition-colors">
            <p className="font-medium text-sm truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
            <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
              <span>{formatSol(c.raised_lamports)} raised</span>
              <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
