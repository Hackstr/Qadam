"use client";

import { useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCampaign, getCampaignBackers, getCampaignUpdates, getCampaigns } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { MilestoneComments } from "@/components/campaign/milestone-comments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatSol, formatPercent, TIER_LABELS,
  TIER_1_MAX_BACKERS, TIER_2_MAX_BACKERS, SOLANA_NETWORK,
} from "@/lib/constants";
import {
  Users, Wallet, ArrowRight, Loader2, ArrowLeft,
  ExternalLink, Share2, Smartphone, Gamepad2,
  BarChart3, Wrench, Globe, Rocket, AlertCircle,
  MapPin, Calendar, Crown, Star, UserCheck,
  Copy, CheckCircle2, Clock, Vote,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

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
  return <Suspense><CampaignDetailContent /></Suspense>;
}

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);

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
    if (campaign?.title) document.title = `${campaign.title} | Qadam`;
    return () => { document.title = "Qadam — Build step by step"; };
  }, [campaign?.title]);

  useEffect(() => {
    if (isNew && campaign) {
      toast.success("Campaign is live on Solana!", {
        description: "Share it to get your first backers",
        duration: 10000,
        action: { label: "Copy link", onClick: () => { navigator.clipboard.writeText(`${window.location.origin}/campaigns/${id}`); toast.success("Link copied!"); } },
      });
    }
  }, [isNew, campaign, id]);

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!campaign) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
      <Link href="/campaigns"><Button variant="outline">Back to Discover</Button></Link>
    </div>
  );

  const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
  const tier = campaign.backers_count < TIER_1_MAX_BACKERS ? 1 : campaign.backers_count < TIER_2_MAX_BACKERS ? 2 : 3;
  const tierInfo = TIER_LABELS[tier as 1 | 2 | 3];
  const backers = backersData?.data || [];
  const updates = updatesData?.data || [];
  const cover = CATEGORY_COVERS[campaign.category || ""] || DEFAULT_COVER;
  const CoverIcon = cover.icon;
  const isOwner = publicKey?.toBase58() === campaign.creator_wallet;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const foundersSpotsLeft = Math.max(0, TIER_1_MAX_BACKERS - campaign.backers_count);
  const descriptionFirst = campaign.description?.split("\n")[0] || "";

  return (
    <div>
      {/* ═══ HERO — Split 60/40 ═══ */}
      <div className="container mx-auto px-4 pt-6 pb-8">
        <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left — Cover image */}
          <div className="rounded-2xl overflow-hidden aspect-[4/3] relative">
            {campaign.cover_image_url ? (
              <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-full object-cover object-[center_70%]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}>
                <CoverIcon className="h-16 w-16 text-white/50" />
              </div>
            )}
            {campaign.category && (
              <Badge className="absolute top-4 left-4 bg-white/90 text-foreground text-xs">{campaign.category}</Badge>
            )}
          </div>

          {/* Right — Title + meta + CTA */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{campaign.title}</h1>
            {descriptionFirst && (
              <p className="text-muted-foreground mt-3 leading-relaxed">{descriptionFirst}</p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Almaty, Kazakhstan</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(campaign.inserted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {campaign.status === "active" && (
                <Link href={`/campaigns/${campaign.id}/back`}>
                  <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8" size="lg">
                    <Wallet className="h-4 w-4" /> Back This Project <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Link copied!");
                }}
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied" : "Share"}
              </Button>
            </div>

            {isOwner && (
              <div className="flex gap-2 mt-4">
                <Link href={`/dashboard/${campaign.id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full text-xs">Edit Campaign</Button>
                </Link>
                <Link href={`/dashboard/${campaign.id}/submit`}>
                  <Button size="sm" className="rounded-full text-xs bg-green-600 hover:bg-green-700 text-white">Submit Evidence</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CREATOR STRIP ═══ */}
      <div className="border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/profile/${campaign.creator_wallet}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
              {(campaign.creator_display_name || campaign.creator_wallet)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{campaign.creator_display_name || `${campaign.creator_wallet.slice(0, 6)}...${campaign.creator_wallet.slice(-4)}`}</p>
              <p className="text-xs text-muted-foreground">Creator · Almaty, Kazakhstan</p>
            </div>
          </Link>
          <Link href={`/profile/${campaign.creator_wallet}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ═══ MAIN CONTENT + SIDEBAR ═══ */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="border-b border-black/[0.06] bg-transparent p-0 h-auto gap-6">
                <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-3 text-sm">About</TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-3 text-sm">Milestones</TabsTrigger>
                <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-3 text-sm flex items-center gap-1.5">Updates {updates.length > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">{updates.length}</Badge>}</TabsTrigger>
                <TabsTrigger value="backers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-3 text-sm flex items-center gap-1.5">Backers {campaign.backers_count > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">{campaign.backers_count}</Badge>}</TabsTrigger>
                {campaign.faq && campaign.faq.length > 0 && (
                  <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-3 text-sm">FAQ</TabsTrigger>
                )}
              </TabsList>

              {/* About */}
              <TabsContent value="about" className="mt-8 space-y-8">
                {campaign.description && (
                  <p className="text-lg leading-relaxed">{campaign.description}</p>
                )}

                {/* Pitch video */}
                {campaign.pitch_video_url && (() => {
                  const url = campaign.pitch_video_url!;
                  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                  const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
                  if (ytMatch) return <div className="aspect-video rounded-xl overflow-hidden border"><iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
                  if (loomMatch) return <div className="aspect-video rounded-xl overflow-hidden border"><iframe src={`https://www.loom.com/embed/${loomMatch[1]}`} className="w-full h-full" allowFullScreen /></div>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 hover:underline flex items-center gap-1">Watch pitch video <ExternalLink className="h-3.5 w-3.5" /></a>;
                })()}

                {/* Risks */}
                {campaign.risks && (
                  <div className="p-5 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-sm text-amber-800">Risks & Challenges</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{campaign.risks}</p>
                  </div>
                )}

                {/* Milestone journey */}
                {campaign.milestones && campaign.milestones.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Milestone journey</h3>
                      <button onClick={() => {}} className="text-xs text-amber-600 hover:underline">View all milestones →</button>
                    </div>
                    <div className="flex items-center gap-0">
                      {campaign.milestones.map((m, i) => {
                        const isDone = m.status === "approved";
                        const isVoting = ["voting_active", "submitted", "extension_requested"].includes(m.status);
                        return (
                          <div key={m.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isDone ? "bg-green-500" : isVoting ? "bg-purple-500 ring-4 ring-purple-100" : "bg-gray-200"
                              }`}>
                                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                {isVoting && <div className="w-2 h-2 rounded-full bg-white" />}
                                {!isDone && !isVoting && <span className="text-[9px] font-bold text-gray-400">{i + 1}</span>}
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-medium truncate max-w-[80px]">{m.title || `M${i + 1}`}</p>
                                <p className={`text-[9px] ${isDone ? "text-green-600" : isVoting ? "text-purple-600" : "text-muted-foreground"}`}>
                                  {isDone ? "Approved" : isVoting ? "Voting" : "Pending"}
                                </p>
                                <p className="text-[9px] text-muted-foreground">{formatSol(m.amount_lamports)}</p>
                              </div>
                            </div>
                            {i < campaign.milestones!.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${isDone ? "bg-green-300" : "bg-gray-100"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Milestones */}
              <TabsContent value="milestones" className="mt-8">
                {campaign.milestones && campaign.milestones.length > 0 ? (
                  <MilestoneTimeline milestones={campaign.milestones} showAppeal={isOwner} />
                ) : <p className="text-muted-foreground">No milestones yet</p>}
              </TabsContent>

              {/* Updates */}
              <TabsContent value="updates" className="mt-8">
                {updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No updates yet from the creator.</p>
                ) : (
                  <div className="space-y-4">
                    {updates.map((u) => (
                      <div key={u.id} className="border border-black/[0.06] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{u.title}</h4>
                          <span className="text-xs text-muted-foreground">{new Date(u.inserted_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{u.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Backers */}
              <TabsContent value="backers" className="mt-8">
                {backers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>No backers yet. Be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backers.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 border-b border-black/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">{idx + 1}</span>
                          <a href={getExplorerUrl(b.wallet_address)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:text-amber-600">
                            {b.wallet_address.slice(0, 4)}...{b.wallet_address.slice(-4)}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-xs text-muted-foreground">{TIER_LABELS[b.tier as 1|2|3]?.name}</span>
                          <span className="font-medium tabular-nums">{formatSol(b.amount_lamports)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* FAQ */}
              {campaign.faq && campaign.faq.length > 0 && (
                <TabsContent value="faq" className="mt-8 space-y-3">
                  {campaign.faq.map((item: { q: string; a: string }, i: number) => (
                    <div key={i} className="border border-black/[0.06] rounded-xl p-4">
                      <p className="font-medium text-sm">{item.q}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <div className="space-y-4">
            {/* Funding card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-3xl font-bold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
                  {progress >= 100 && <Badge className="bg-green-50 text-green-700 text-xs">Funded</Badge>}
                  {progress > 0 && progress < 100 && <Badge className="bg-amber-50 text-amber-700 text-xs">{progress}% funded</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">raised of {formatSol(campaign.goal_lamports)} goal</p>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>

                {/* Escrow */}
                {campaign.solana_pubkey && !campaign.solana_pubkey.startsWith("demo_") ? (
                  <a href={getExplorerUrl(campaign.solana_pubkey)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs p-2.5 bg-green-50 border border-green-100 rounded-lg mb-4 hover:bg-green-100 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-700">{campaign.raised_lamports > 0 ? `${formatSol(campaign.raised_lamports)} locked in on-chain escrow` : "Funds go directly to on-chain escrow"}</span>
                    <ExternalLink className="h-3 w-3 ml-auto text-green-500" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs p-2.5 bg-green-50 border border-green-100 rounded-lg mb-4">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-700">Funds locked in smart contract</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center mb-5">
                  <div>
                    <p className="text-lg font-bold tabular-nums">{campaign.backers_count}</p>
                    <p className="text-[10px] text-muted-foreground">backers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{campaign.milestones_approved}/{campaign.milestones_count}</p>
                    <p className="text-[10px] text-muted-foreground">milestones</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">2.5%</p>
                    <p className="text-[10px] text-muted-foreground">platform fee</p>
                  </div>
                </div>

                {/* CTA */}
                {campaign.status === "active" && (
                  <Link href={`/campaigns/${campaign.id}/back`}>
                    <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full" size="lg">
                      <Wallet className="h-4 w-4" /> Back This Project <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}

                {/* Founders spots */}
                {tier === 1 && foundersSpotsLeft > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    <span><strong>{foundersSpotsLeft} Founders spots left</strong> — back now for the full 1.0 points/SOL</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Backer rewards */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-1">What you get as a backer</h3>
                <p className="text-xs text-muted-foreground mb-4">For every SOL you back, you earn ownership points. Earlier backers earn more.</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-semibold text-sm text-green-700">Founders</p>
                        <p className="text-[10px] text-green-600">First 50 backers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-700">1.0 pts/SOL</p>
                      <p className="text-[10px] text-green-600">{foundersSpotsLeft} of 50 left</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-semibold text-sm text-amber-700">Early Backers</p>
                        <p className="text-[10px] text-amber-600">Backers 51–250</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-amber-700">0.67 pts/SOL</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Supporters</p>
                        <p className="text-[10px] text-gray-500">Everyone after 250</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-gray-600">0.5 pts/SOL</p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong>What are ownership points?</strong> Points give you a voting share in the project and a claim on tokens released as milestones are approved. 1 point = 1 vote.
                  </p>
                </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <p className="text-sm font-semibold text-purple-700">Community is voting</p>
                      </div>
                      {votingMs.extension_deadline && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.ceil((new Date(votingMs.extension_deadline).getTime() - Date.now()) / 86400000)}d left</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Milestone {votingMs.index + 1}: {votingMs.title || "Untitled"}</p>
                    {votingMs.votes_approve_percent != null && (
                      <div className="mb-3">
                        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${votingMs.votes_approve_percent}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{votingMs.votes_approve_percent}% YES · {votingMs.votes_count || 0} votes</p>
                      </div>
                    )}
                    <Link href={`/campaigns/${campaign.id}/vote`}>
                      <Button size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                        <Vote className="h-3.5 w-3.5" /> Cast your vote
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Governance link */}
            <Link href={`/campaigns/${campaign.id}/vote`}>
              <div className="border border-black/[0.06] rounded-xl p-4 text-center hover:border-black/[0.12] transition-colors">
                <p className="text-sm font-medium">Governance</p>
                <p className="text-xs text-muted-foreground mt-0.5">View or cast votes on milestones</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Similar campaigns */}
        <SimilarCampaigns currentId={campaign.id} />
      </div>
    </div>
  );
}

function SimilarCampaigns({ currentId }: { currentId: string }) {
  const { data } = useQuery({
    queryKey: ["campaigns-for-similar"],
    queryFn: () => getCampaigns({ limit: 4 }),
  });
  const similar = (data?.data || []).filter((c: any) => c.id !== currentId).slice(0, 3);
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
