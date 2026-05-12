"use client";

import { useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCampaign, getCampaignBackers, getCampaignUpdates, getCampaigns } from "@/lib/api";
import { MilestoneTimeline } from "@/components/campaign/milestone-timeline";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatSol, formatPercent, TIER_LABELS,
  getExplorerUrl, lamportsToSol,
} from "@/lib/constants";
import { FundingCard } from "@/components/qadam/funding-card";
import { TierRewardsCard } from "@/components/qadam/tier-rewards-card";
import { ActiveVoteWidget } from "@/components/qadam/active-vote-widget";
import { CreatorStrip } from "@/components/qadam/creator-strip";
import {
  Users, Wallet, ArrowRight, Loader2, ArrowLeft,
  ExternalLink, Share2, AlertCircle,
  CheckCircle2, Clock, Vote,
  Globe, Heart, ShieldCheck, Code,
  Image, Play,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { CATEGORY_COVERS, DEFAULT_COVER } from "@/components/campaign/campaign-card";

export default function CampaignDetailPage() {
  return <Suspense><CampaignDetailContent /></Suspense>;
}

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [selectedMilestone, setSelectedMilestone] = useState(0);

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
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
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

  // Accent color from campaign customization
  const ACCENT_MAP: Record<string, { bg: string; hover: string }> = {
    forest: { bg: "bg-amber-500", hover: "hover:bg-amber-600" },
    sage:   { bg: "bg-[#75A58A]", hover: "hover:bg-[#5d8a72]" },
    warm:   { bg: "bg-[#8B7355]", hover: "hover:bg-[#705c44]" },
    plum:   { bg: "bg-[#6B5B8D]", hover: "hover:bg-[#564873]" },
    slate:  { bg: "bg-[#475569]", hover: "hover:bg-[#374152]" },
    deep:   { bg: "bg-[#1B3B30]", hover: "hover:bg-[#0e2a21]" },
  };
  const accent = ACCENT_MAP[campaign.accent_color || "forest"] || ACCENT_MAP.forest;

  // Campaign timing
  const launchedAt = campaign.launched_at ? new Date(campaign.launched_at) : new Date(campaign.inserted_at);
  const fundingDeadlineDays = campaign.days_to_funding_deadline ?? 30;
  const now = new Date();
  const daysSinceLaunch = Math.max(1, Math.ceil((now.getTime() - launchedAt.getTime()) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, fundingDeadlineDays - daysSinceLaunch);

  // Token name from mint address or default
  const tokenName = campaign.token_mint_address
    ? campaign.token_mint_address.slice(0, 4).toUpperCase()
    : campaign.title?.split(" ")[0]?.toUpperCase()?.slice(0, 5) || "TOKEN";

  // Voting milestone
  const votingMs = (campaign.milestones || []).find(
    (m) => m.status === "voting_active" || m.status === "extension_requested" || m.status === "submitted"
  );

  // Gallery thumbs (show up to 5 from gallery_urls)
  const galleryUrls = campaign.gallery_urls || [];
  const galleryExtra = Math.max(0, galleryUrls.length - 4);

  return (
    <div className="animate-page-enter">
      {/* ═══ BREADCRUMB ═══ */}
      <div className="max-w-[1240px] mx-auto px-8 pt-6">
        <Link href="/campaigns" className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-amber-600 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          All campaigns{campaign.category ? ` \u00B7 ${campaign.category}` : ""}
        </Link>
      </div>

      {/* ═══ HERO — Split layout ═══ */}
      <div className="max-w-[1240px] mx-auto px-8 pt-4 pb-7">
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] gap-12 items-start">
          {/* Left — Cover art */}
          <div className="relative aspect-square rounded-[26px] overflow-hidden shadow-[0_30px_60px_-32px_rgba(22,32,26,0.30)]">
            {campaign.cover_image_url ? (
              <img src={campaign.cover_image_url} alt={campaign.title} className="w-full h-full object-cover object-[center_70%]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(140deg, ${cover.from} 0%, ${cover.to} 50%, #16201A 100%)` }}>
                <CoverIcon className="h-28 w-28 text-white/[0.85]" />
              </div>
            )}
            {/* Subtle light overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 40% at 30% 25%, rgba(255,255,255,0.18), transparent 70%)" }} />
            {campaign.category && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/45 text-white/95 text-[11px] tracking-[0.16em] uppercase font-semibold backdrop-blur-sm">
                {campaign.category}
              </span>
            )}
            {/* Gallery thumbnails */}
            {(galleryUrls.length > 0 || campaign.pitch_video_url) && (
              <div className="absolute left-4 right-4 bottom-4 flex gap-1.5">
                {/* Cover thumb (active) */}
                <div className="flex-1 h-14 rounded-[10px] bg-white/[0.08] border border-white/[0.55] flex items-center justify-center overflow-hidden">
                  {campaign.cover_image_url ? (
                    <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Image className="h-[22px] w-[22px] text-white/55" />
                  )}
                </div>
                {galleryUrls.slice(0, 2).map((url, i) => (
                  <div key={i} className="flex-1 h-14 rounded-[10px] bg-white/[0.08] border border-white/[0.14] overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {campaign.pitch_video_url && (
                  <div className="flex-1 h-14 rounded-[10px] bg-white/[0.08] border border-white/[0.14] flex items-center justify-center">
                    <Play className="h-[22px] w-[22px] text-white/55" />
                  </div>
                )}
                {galleryExtra > 0 && (
                  <div className="flex-1 h-14 rounded-[10px] bg-white/[0.08] border border-white/[0.14] flex items-center justify-center">
                    <span className="font-mono text-[11px] text-white/55">+{galleryExtra}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — Title + meta + CTA + stats */}
          <div className="flex flex-col justify-center">
            {/* Status line */}
            <div className="flex items-center gap-2 flex-wrap font-mono text-[11px] text-muted-foreground mb-3.5">
              {campaign.status === "active" && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-600 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_0_3px_rgba(107,212,155,0.25)] animate-pulse" />
                    LIVE &mdash; DAY {daysSinceLaunch} OF {fundingDeadlineDays}
                  </span>
                  <span>&middot; {daysLeft} {daysLeft === 1 ? "day" : "days"} left to back</span>
                </>
              )}
              {campaign.status === "completed" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> COMPLETED
                </span>
              )}
              {campaign.status === "refunded" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                  REFUNDED
                </span>
              )}
              {campaign.status === "draft" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full font-semibold">
                  DRAFT
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-[0.96] tracking-[-0.025em] mb-4.5">
              {campaign.title}
            </h1>

            {/* Description (first paragraph) */}
            {descriptionFirst && (
              <p className="text-lg text-foreground/80 leading-relaxed max-w-[540px] mb-6">
                {descriptionFirst}
              </p>
            )}

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 mb-7">
              {campaign.creator_location && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground/80">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  {campaign.creator_location}
                </span>
              )}
              {campaign.team_members && campaign.team_members.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground/80">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  Team of {campaign.team_members.length}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground/80">
                <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                On-chain escrow
              </span>
              {campaign.tags?.includes("open-source") && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground/80">
                  <Code className="h-3 w-3 text-muted-foreground" />
                  Open source
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2.5 mb-8">
              {campaign.status === "active" && (
                <Link href={`/campaigns/${campaign.id}/back`}>
                  <Button className={`gap-2 ${accent.bg} ${accent.hover} text-white rounded-full px-6 shadow-[0_14px_32px_-16px_rgba(31,71,49,0.55)]`} size="lg">
                    <Wallet className="h-3.5 w-3.5" /> Back This Project <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
              {campaign.status === "completed" && (
                <Badge className="bg-green-50 text-green-700 text-sm px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Campaign completed &mdash; {formatSol(campaign.raised_lamports)} raised
                </Badge>
              )}
              {campaign.status === "refunded" && (
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  Funds returned to backers
                </Badge>
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
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Share"}
              </Button>
              <Button variant="outline" className="gap-2 rounded-full">
                <Heart className="h-3.5 w-3.5" /> Save
              </Button>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-2 mb-8">
                <Link href={`/dashboard/${campaign.id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full text-xs">Edit Campaign</Button>
                </Link>
                <Link href={`/dashboard/${campaign.id}/submit`}>
                  <Button variant="outline" size="sm" className="rounded-full text-xs border-amber-200 text-amber-700 hover:bg-amber-50">Submit Evidence</Button>
                </Link>
              </div>
            )}

            {/* 4-column stat strip */}
            <div className="grid grid-cols-4 border-y border-border py-4.5">
              <div className="px-4.5 border-r border-foreground/[0.06] first:pl-0">
                <div className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-1.5">Funded</div>
                <div className="font-display text-[22px] leading-none tracking-[-0.02em]">
                  {lamportsToSol(campaign.raised_lamports).toFixed(2)}
                  <span className="font-sans text-muted-foreground text-[11px] font-medium ml-1">/ {lamportsToSol(campaign.goal_lamports).toFixed(0)} SOL</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{progress}% &mdash; {daysLeft}d left</div>
              </div>
              <div className="px-4.5 border-r border-foreground/[0.06]">
                <div className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-1.5">Backers</div>
                <div className="font-display text-[22px] leading-none tracking-[-0.02em]">{campaign.backers_count}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {campaign.tier_config && campaign.tier_config.length > 0
                    ? campaign.tier_config.map((t, i) => (
                        <span key={i}>
                          {i > 0 && " · "}
                          {t.max_spots ? `${t.max_spots}` : "∞"} {t.name}
                        </span>
                      ))
                    : "\u00A0"}
                </div>
              </div>
              <div className="px-4.5 border-r border-foreground/[0.06]">
                <div className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-1.5">Milestones</div>
                <div className="font-display text-[22px] leading-none tracking-[-0.02em]">{campaign.milestones_approved} / {campaign.milestones_count}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {votingMs ? "M" + ((votingMs.index ?? 0) + 1) + " voting now" : "\u00A0"}
                </div>
              </div>
              <div className="px-4.5 last:pr-0">
                <div className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-1.5">Token</div>
                <div className="font-display text-[22px] leading-none tracking-[-0.02em]">{tokenName}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {campaign.tokens_per_lamport ? `1 SOL = ${campaign.tokens_per_lamport.toLocaleString()} pts` : "\u00A0"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ GALLERY (full-width, if images) ═══ */}
      {galleryUrls.length > 0 && (
        <div className="max-w-[1240px] mx-auto px-8 mt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {galleryUrls.map((url: string, i: number) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted/30 hover:scale-[1.01] transition-transform"
              >
                <img
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CREATOR STRIP ═══ */}
      <div className="max-w-[1240px] mx-auto px-8">
        <CreatorStrip
          walletAddress={campaign.creator_wallet}
          displayName={campaign.creator_display_name}
          location={campaign.creator_location}
        />
      </div>

      {/* ═══ MAIN CONTENT + SIDEBAR ═══ */}
      <div className="max-w-[1240px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          {/* Left — Content */}
          <div className="min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="relative border-b border-border bg-transparent p-0 h-auto gap-0">
                {[
                  { value: "about", label: "About" },
                  { value: "milestones", label: "Milestones", count: campaign.milestones_count },
                  { value: "updates", label: "Updates", count: updates.length },
                  { value: "backers", label: "Backers", count: campaign.backers_count },
                  ...(campaign.faq && campaign.faq.length > 0 ? [{ value: "faq", label: "FAQ" }] : []),
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-transparent px-4.5 pb-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
                  >
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="flex items-center gap-2">
                      {tab.label}
                      {"count" in tab && (tab as any).count > 0 && (
                        <span className="font-mono text-[11px] px-1.5 py-px rounded-full bg-amber-100 text-amber-600 font-semibold">{(tab as any).count}</span>
                      )}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* About — Foundation v1 story split */}
              <TabsContent value="about" className="mt-7 space-y-7">
                {/* Story split sections */}
                {(campaign.problem || campaign.solution) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.problem && (
                      <div className="bg-[rgba(194,83,46,0.06)] border border-[rgba(194,83,46,0.22)] rounded-[18px] p-5">
                        <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase font-bold text-[var(--terracotta)] mb-2.5">
                          <AlertCircle className="h-3.5 w-3.5" /> Problem
                        </div>
                        <h3 className="font-display text-[22px] tracking-[-0.01em] leading-[1.2] mb-2">{campaign.problem.split(".")[0]}.</h3>
                        <p className="text-sm leading-relaxed text-foreground/80">{campaign.problem}</p>
                      </div>
                    )}
                    {campaign.solution && (
                      <div className="bg-card border border-border rounded-[18px] p-5">
                        <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase font-bold text-amber-600 mb-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Solution
                        </div>
                        <h3 className="font-display text-[22px] tracking-[-0.01em] leading-[1.2] mb-2">{campaign.solution.split(".")[0]}.</h3>
                        <p className="text-sm leading-relaxed text-foreground/80">{campaign.solution}</p>
                      </div>
                    )}
                  </div>
                )}

                {campaign.why_now && (
                  <div>
                    <h3 className="font-display text-xl tracking-tight mb-2">Why now</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">{campaign.why_now}</p>
                  </div>
                )}
                {campaign.background && (
                  <div>
                    <h3 className="font-display text-xl tracking-tight mb-2">Background</h3>
                    <p className="text-base leading-relaxed text-muted-foreground">{campaign.background}</p>
                  </div>
                )}

                {/* Fallback to old description if no story split */}
                {!campaign.problem && !campaign.solution && campaign.description && (
                  <p className="text-base leading-relaxed text-muted-foreground max-w-[640px]">{campaign.description}</p>
                )}

                {/* Team */}
                {campaign.team_members && campaign.team_members.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl tracking-tight mb-3">Team</h3>
                    <div className="space-y-2">
                      {campaign.team_members.map((member, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
                  <div className="p-5 bg-yellow-50/60 border-l-4 border-yellow-400 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <h3 className="font-semibold text-sm text-yellow-800">Risks & Challenges</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{campaign.risks}</p>
                  </div>
                )}

                {/* Milestone journey */}
                {campaign.milestones && campaign.milestones.length > 0 && (() => {
                  const ms = campaign.milestones;
                  const sel = ms[selectedMilestone] || ms[0];
                  const selDone = sel?.status === "approved";
                  const selVoting = ["voting_active", "submitted", "extension_requested"].includes(sel?.status || "");
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl tracking-tight">Milestone journey</h3>
                        <button onClick={() => setActiveTab("milestones")} className="text-xs text-amber-600 hover:underline">View all milestones →</button>
                      </div>

                      {/* Milestone selector buttons */}
                      <div className="flex gap-1.5 mb-4">
                        {ms.map((m, i) => {
                          const isDone = m.status === "approved";
                          const isVoting = ["voting_active", "submitted", "extension_requested"].includes(m.status);
                          const isActive = i === selectedMilestone;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMilestone(i)}
                              className={`flex-1 py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                isActive
                                  ? isDone ? "bg-green-50 border-green-300 shadow-sm" : isVoting ? "bg-purple-50 border-purple-300 shadow-sm" : "bg-card border-amber-300 shadow-sm"
                                  : "bg-card border-border hover:border-foreground/20"
                              }`}
                            >
                              <p className="font-mono text-[10px] text-muted-foreground">M{i + 1}</p>
                              <p className={`text-xs font-semibold truncate mt-0.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                {m.title || `Milestone ${i + 1}`}
                              </p>
                              <p className={`text-[10px] mt-0.5 ${isDone ? "text-green-600" : isVoting ? "text-purple-600" : "text-muted-foreground"}`}>
                                {isDone ? "✓ Approved" : isVoting ? "● Voting" : "○ Pending"}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected milestone detail */}
                      {sel && (
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-[10px] text-muted-foreground">M{selectedMilestone + 1}</span>
                              <h4 className="font-display text-lg tracking-tight">{sel.title || `Milestone ${selectedMilestone + 1}`}</h4>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold">{formatSol(sel.amount_lamports)}</p>
                              <p className={`text-[10px] font-semibold ${selDone ? "text-green-600" : selVoting ? "text-purple-600" : "text-muted-foreground"}`}>
                                {selDone ? "✓ Approved" : selVoting ? "● Voting" : "○ Pending"}
                              </p>
                            </div>
                          </div>

                          {sel.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{sel.description}</p>
                          )}

                          {sel.acceptance_criteria && (
                            <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Acceptance criteria</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{sel.acceptance_criteria}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                            {sel.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Deadline: {new Date(sel.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                      <div key={u.id} className="border border-border rounded-xl p-4">
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
                    {backers.map((b: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 border-b border-foreground/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {(b.display_name || b.wallet_address)[0].toUpperCase()}
                          </div>
                          <div>
                            {b.display_name ? (
                              <span className="text-sm font-medium">{b.display_name}</span>
                            ) : (
                              <a href={getExplorerUrl(b.wallet_address)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:text-amber-600">
                                {b.wallet_address.slice(0, 4)}...{b.wallet_address.slice(-4)}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-xs text-muted-foreground">
                            {campaign.tier_config?.[((b.tier || 1) - 1)]?.name || TIER_LABELS[b.tier as 1|2|3]?.name}
                          </span>
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
                    <div key={i} className="border border-border rounded-xl p-4">
                      <p className="font-medium text-sm">{item.q}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-20">
            <FundingCard campaign={campaign} accentClass={accent.bg} />
            <TierRewardsCard backersCount={campaign.backers_count} tierConfig={campaign.tier_config} />

            {/* Voting rules */}
            {campaign.vote_period_days && (
              <div className="border border-border rounded-xl p-4">
                <p className="text-[13px] tracking-[0.04em] uppercase text-muted-foreground font-bold mb-3">Voting rules</p>
                <div className="flex gap-4.5 text-[13px] text-foreground/80 flex-wrap">
                  <span>Period: <strong className="font-mono text-foreground">{campaign.vote_period_days}d</strong></span>
                  <span>Quorum: <strong className="font-mono text-foreground">{Math.round((campaign.quorum_pct || 0.2) * 100)}%</strong></span>
                  <span>Threshold: <strong className="font-mono text-foreground">{Math.round((campaign.approval_threshold_pct || 0.5) * 100)}%</strong></span>
                </div>
              </div>
            )}

            {/* Active vote widget */}
            {votingMs && <ActiveVoteWidget campaignId={campaign.id} milestone={votingMs} />}

            {/* AI Helper removed — Foundation §06: AI is creator-only, no backer-side surfaces */}

            {/* Governance link */}
            <Link href={`/campaigns/${campaign.id}/vote`}>
              <div className="border border-border rounded-xl p-4 flex items-center gap-3 hover:border-foreground/[0.12] transition-colors">
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
    queryFn: () => getCampaigns({ limit: 5 }),
  });
  const similar = (data?.data || []).filter((c) => c.id !== currentId).slice(0, 3);
  if (similar.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display text-2xl tracking-[-0.02em]">Other live campaigns</h3>
        <Link href="/campaigns" className="text-sm font-medium text-amber-600 hover:underline">All campaigns →</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        {similar.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
