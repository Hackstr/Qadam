"use client";

import { useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCampaign, getCampaignBackers, getCampaignUpdates, getCampaigns } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { MilestoneComments } from "@/components/campaign/milestone-comments";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatSol, formatPercent, TIER_LABELS,
  SOLANA_NETWORK, getExplorerUrl,
} from "@/lib/constants";
import { MilestoneDots } from "@/components/qadam/milestone-dots";
import { FundingCard } from "@/components/qadam/funding-card";
import { TierRewardsCard } from "@/components/qadam/tier-rewards-card";
import { ActiveVoteWidget } from "@/components/qadam/active-vote-widget";
import { CreatorStrip } from "@/components/qadam/creator-strip";
import {
  Users, Wallet, ArrowRight, Loader2, ArrowLeft,
  ExternalLink, Share2, AlertCircle, Sparkles,
  Calendar, Copy, CheckCircle2, Clock, Vote,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { CATEGORY_COVERS, DEFAULT_COVER } from "@/components/campaign/campaign-card";

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
  const backers = backersData?.data || [];
  const updates = updatesData?.data || [];
  const cover = CATEGORY_COVERS[campaign.category || ""] || DEFAULT_COVER;
  const CoverIcon = cover.icon;
  const isOwner = publicKey?.toBase58() === campaign.creator_wallet;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
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
            <h1 className="font-display text-3xl md:text-4xl tracking-tight leading-tight">{campaign.title}</h1>
            {descriptionFirst && (
              <p className="text-muted-foreground mt-3 leading-relaxed">{descriptionFirst}</p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
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
      <CreatorStrip
        walletAddress={campaign.creator_wallet}
        displayName={campaign.creator_display_name}
        location={campaign.creator_location}
      />

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

              {/* About — Foundation v1 story split */}
              <TabsContent value="about" className="mt-8 space-y-8">
                {/* Story split sections */}
                {campaign.problem && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">The Problem</h3>
                    <p className="text-base leading-relaxed">{campaign.problem}</p>
                  </div>
                )}
                {campaign.solution && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">The Solution</h3>
                    <p className="text-base leading-relaxed">{campaign.solution}</p>
                  </div>
                )}
                {campaign.why_now && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Why Now</h3>
                    <p className="text-base leading-relaxed">{campaign.why_now}</p>
                  </div>
                )}
                {campaign.background && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Background</h3>
                    <p className="text-base leading-relaxed">{campaign.background}</p>
                  </div>
                )}

                {/* Fallback to old description if no story split */}
                {!campaign.problem && !campaign.solution && campaign.description && (
                  <p className="text-lg leading-relaxed">{campaign.description}</p>
                )}

                {/* Team */}
                {campaign.team_members && campaign.team_members.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Team</h3>
                    <div className="space-y-2">
                      {campaign.team_members.map((member: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.06]">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(member.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                          {member.social_link && (
                            <a href={member.social_link} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-amber-600 hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
                    <MilestoneDots
                      total={campaign.milestones.length}
                      approved={campaign.milestones_approved}
                      variant="connected"
                      size="md"
                    />
                    <div className="flex mt-2">
                      {campaign.milestones.map((m: any, i: number) => {
                        const isDone = m.status === "approved";
                        const isVoting = ["voting_active", "submitted", "extension_requested"].includes(m.status);
                        return (
                          <div key={m.id} className="flex-1 text-center">
                            <p className="text-[10px] font-medium truncate">{m.title || `M${i + 1}`}</p>
                            <p className={`text-[9px] ${isDone ? "text-green-600" : isVoting ? "text-purple-600" : "text-muted-foreground"}`}>
                              {isDone ? "Approved" : isVoting ? "Voting" : "Pending"}
                            </p>
                            <p className="text-[9px] text-muted-foreground">{formatSol(m.amount_lamports)}</p>
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
            <FundingCard campaign={campaign} />
            <TierRewardsCard backersCount={campaign.backers_count} tierConfig={campaign.tier_config} />

            {/* Voting rules */}
            {campaign.vote_period_days && (
              <div className="border border-black/[0.06] rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Voting rules</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Period: <strong className="text-foreground">{campaign.vote_period_days}d</strong></span>
                  <span>Quorum: <strong className="text-foreground">{Math.round((campaign.quorum_pct || 0.2) * 100)}%</strong></span>
                  <span>Threshold: <strong className="text-foreground">{Math.round((campaign.approval_threshold_pct || 0.5) * 100)}%</strong></span>
                </div>
              </div>
            )}

            {/* Active vote widget */}
            {(() => {
              const votingMs = (campaign.milestones || []).find(
                (m: any) => m.status === "voting_active" || m.status === "extension_requested" || m.status === "submitted"
              );
              if (!votingMs) return null;
              return <ActiveVoteWidget campaignId={campaign.id} milestone={votingMs} />;
            })()}

            {/* AI Helper trigger */}
            <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold">Ask Qadam AI</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Get instant analysis of this project — risks, team, budget, milestones.</p>
              <div className="space-y-1.5">
                {["Is this project realistic?", "What are the risks?", "Compare to similar campaigns"].map((q) => (
                  <button key={q} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white border border-black/[0.06] hover:border-amber-200 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Governance link */}
            <Link href={`/campaigns/${campaign.id}/vote`}>
              <div className="border border-black/[0.06] rounded-xl p-4 flex items-center gap-3 hover:border-black/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Vote className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Governance</p>
                  <p className="text-xs text-muted-foreground">{campaign.milestones_approved} of {campaign.milestones_count} milestones resolved</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
