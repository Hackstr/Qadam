"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import { getCampaigns, getMe } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol, formatPercent } from "@/lib/constants";
import { MilestoneDots } from "@/components/qadam/milestone-dots";
import { NextActionAlert } from "@/components/qadam/next-action-alert";
import { DailyNudge } from "@/components/ai/daily-nudge";
import {
  Loader2, Plus, CheckCircle2, ArrowRight, Rocket,
  BarChart2, Share2, ExternalLink, PenLine, ChevronDown,
  Code, Users, Cpu,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Rocket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-display text-3xl tracking-tight mb-2">Creator Dashboard</h1>
        <p className="text-muted-foreground mb-6">Connect your wallet to view your campaigns.</p>
        <WalletMultiButton
          style={{
            backgroundColor: "var(--foreground)",
            height: "48px",
            borderRadius: "9999px",
            fontSize: "15px",
            padding: "0 32px",
            lineHeight: "48px",
            width: "100%",
            justifyContent: "center",
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-page-enter">
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

      {/* Header — only when campaigns exist */}
      {myCampaigns.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              {displayName ? `Welcome back, ${displayName}` : "My Campaigns"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your campaigns.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Could not load campaigns.</p>
        </div>
      ) : myCampaigns.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <div className="space-y-6">
          {/* AI Companion Daily Nudge */}
          {myCampaigns.filter(c => c.status === "active").slice(0, 1).map(c => (
            <DailyNudge key={`nudge-${c.id}`} campaignId={c.id} />
          ))}

          {myCampaigns.map((campaign) => {
            const progress = formatPercent(campaign.raised_lamports, campaign.goal_lamports);
            const nextMilestone = (campaign.milestones || [])[campaign.milestones_approved];
            const hasUnsubmitted = campaign.status === "active" && nextMilestone && nextMilestone.status === "pending";
            const daysLeft = nextMilestone?.deadline ? Math.max(0, Math.ceil((new Date(nextMilestone.deadline).getTime() - Date.now()) / 86400000)) : null;

            return (
              <Card key={campaign.id} className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-black/[0.06]">
                <CardContent className="p-0">
                  {/* Campaign header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${
                            campaign.status === "active" ? "bg-green-50 text-green-700" :
                            campaign.status === "completed" ? "bg-amber-50 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{campaign.status}</Badge>
                        </div>
                        <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                          <h2 className="text-xl font-bold">{campaign.title}</h2>
                        </Link>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-mono font-bold tabular-nums">{formatSol(campaign.raised_lamports)}</p>
                        <p className="text-xs text-muted-foreground">of {formatSol(campaign.goal_lamports)} goal</p>
                      </div>
                    </div>

                    {/* Milestone path — dots with lines */}
                    <MilestoneDots
                      total={campaign.milestones_count}
                      approved={campaign.milestones_approved}
                      variant="connected"
                      size="sm"
                      className="mt-4"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {campaign.milestones_approved} of {campaign.milestones_count} milestones complete · {progress}% funded · {campaign.backers_count} backers
                      {campaign.funding_deadline && campaign.status === "active" && (() => {
                        const days = Math.max(0, Math.ceil((new Date(campaign.funding_deadline).getTime() - Date.now()) / 86400000));
                        return days <= 14 ? <> · <span className="text-amber-600 font-medium">{days}d left</span></> : null;
                      })()}
                    </p>
                  </div>

                  {/* Next action — prominent */}
                  {hasUnsubmitted && (
                    <div className="mx-6 mb-4">
                      <NextActionAlert
                        campaignId={campaign.id}
                        milestoneNumber={campaign.milestones_approved + 1}
                      />
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

/* ─── Empty State ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
}

function DashboardEmptyState() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "Is there a deposit?",
      a: "Yes, 0.5% security deposit that is returned when your campaign concludes — whether it succeeds or not.",
    },
    {
      q: "Can I edit after launch?",
      a: "Off-chain fields yes, milestones and voting rules lock at launch.",
    },
    {
      q: "What's the platform fee?",
      a: "2.5% taken on release, never on backing.",
    },
    {
      q: "What if a vote fails?",
      a: "Creator revises evidence and resubmits. The community gets another chance to review. If it fails again, extension or refund flow begins.",
    },
  ]

  const templates = [
    { name: "Software", avg: "42 SOL", gradient: "from-emerald-100 to-teal-100", icon: <Code className="w-5 h-5 text-emerald-600" />, iconBg: "bg-emerald-50" },
    { name: "Community / DAO", avg: "28 SOL", gradient: "from-amber-100 to-orange-100", icon: <Users className="w-5 h-5 text-amber-600" />, iconBg: "bg-amber-50" },
    { name: "Hardware", avg: "85 SOL", gradient: "from-violet-100 to-purple-100", icon: <Cpu className="w-5 h-5 text-violet-600" />, iconBg: "bg-violet-50" },
  ]

  return (
    <div className="space-y-16 pb-20">
      {/* ── SECTION 1: Hero — text left, tabs right ── */}
      <motion.section
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div>
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-4"
          >
            YOUR DASHBOARD
          </motion.p>
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-[52px] leading-[1.05] tracking-tight mb-4"
          >
            Time to <span className="italic">launch</span>?
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg text-muted-foreground leading-relaxed max-w-lg"
          >
            Define your idea, set milestones, raise on-chain. You&apos;ll be funded as you deliver — not before.
          </motion.p>
        </div>
        <motion.div custom={3} variants={fadeUp} className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-medium bg-foreground text-background px-4 py-1.5 rounded-full">
            All
          </span>
          {["Drafts", "Live", "Past"].map((tab) => (
            <span key={tab} className="text-sm text-muted-foreground px-3 py-1.5">
              {tab} &middot; 0
            </span>
          ))}
        </motion.div>
      </motion.section>

      {/* ── SECTION 2: CTA + Draft mockup card ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-2 gap-12 items-start"
      >
        {/* Left — text + buttons */}
        <div>
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-4 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            YOU&apos;RE THE CREATOR
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-display text-[44px] leading-[1.08] tracking-tight mb-4"
          >
            Build with the{" "}
            <span className="italic text-amber-600">community</span>, not against them.
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-muted-foreground leading-relaxed mb-8 max-w-md"
          >
            Set realistic milestones. Get the first one funded. Ship. Get the next one funded. Honesty compounds — and on Qadam, the contract enforces it.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-3">
            <Link href="/create">
              <Button className="gap-2 bg-[#1a2f23] hover:bg-[#243d2e] text-white rounded-full px-6" size="lg">
                <Plus className="h-4 w-4" /> Create your first campaign
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" className="rounded-full px-6" size="lg">
                Read the playbook
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Right — dark draft mockup card */}
        <motion.div custom={2} variants={fadeUp} className="relative">
          <div className="rounded-[20px] bg-[#2a2a26] p-6 text-white/80 shadow-lg">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] tracking-[0.14em] uppercase text-white/40">
                &middot; DRAFT &middot;
              </span>
              <span className="text-[10px] tracking-[0.1em] uppercase text-white/30">
                DAY 0 OF 30
              </span>
            </div>
            {/* Title placeholder */}
            <div className="space-y-2 mb-6">
              <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
            </div>
            {/* Story section */}
            <div className="border-t border-white/[0.08] pt-4 mb-5">
              <p className="text-[10px] tracking-[0.14em] uppercase text-white/30 mb-3">
                // STORY
              </p>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-white/[0.06]" />
                <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
                <div className="h-3 w-3/4 rounded bg-white/[0.05]" />
              </div>
            </div>
            {/* Milestones section */}
            <div className="border-t border-white/[0.08] pt-4 mb-5">
              <p className="text-[10px] tracking-[0.14em] uppercase text-white/30 mb-3">
                // MILESTONES &middot; 0
              </p>
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="text-xs text-white/25 w-3 tabular-nums">{n}</span>
                    <div className="h-2.5 flex-1 rounded bg-white/[0.06]" />
                    <span className="text-[10px] text-white/20">&mdash; SOL</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Waiting to be filled */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[11px] text-white/40">Waiting to be filled</span>
            </div>
          </div>
          {/* Big green floater button */}
          <Link href="/create">
            <div className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-[#1a2f23] flex items-center justify-center shadow-xl hover:-translate-y-0.5 transition-transform cursor-pointer">
              <ArrowRight className="h-5 w-5 text-white -rotate-45" />
            </div>
          </Link>
        </motion.div>
      </motion.section>

      {/* ── SECTION 3: Three-step process ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", label: "DRAFT", title: "5 steps, ~20 min", desc: "Idea, story, team, milestones, preview. Auto-saved, you can leave anytime." },
            { step: "02", label: "LAUNCH", title: "0.4 SOL deposit", desc: "Refundable. Keeps spam off the platform. Smart contract goes live on Solana." },
            { step: "03", label: "DELIVER", title: "Ship, vote, repeat", desc: "Each milestone you ship triggers a community vote. Pass \u2192 funds release." },
          ].map((item, i) => (
            <motion.div key={i} custom={i + 1} variants={fadeUp}>
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground font-semibold mb-2">
                {item.step} &middot; {item.label}
              </p>
              <p className="font-display text-lg mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 4: Templates ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.h3 custom={0} variants={fadeUp} className="font-display text-2xl tracking-tight mb-6">
          Start from a template
        </motion.h3>
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map((tpl, i) => (
            <motion.div key={i} custom={i + 1} variants={fadeUp}>
              <Link href="/create">
                <div className={`rounded-[18px] border border-black/[0.06] bg-gradient-to-br ${tpl.gradient} p-6 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}>
                  <div className={`w-10 h-10 rounded-xl ${tpl.iconBg} border border-black/[0.04] mb-4 flex items-center justify-center`}>
                    {tpl.icon}
                  </div>
                  <p className="font-display text-lg mb-1">{tpl.name}</p>
                  <p className="text-sm text-muted-foreground">avg raise &middot; {tpl.avg}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 5: FAQ ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-2xl"
      >
        <div className="border-t border-foreground/10 pt-12">
          <motion.h3 custom={0} variants={fadeUp} className="font-display text-2xl tracking-tight">
            Before you launch
          </motion.h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Common questions from new creators</p>
          <div className="space-y-0 divide-y divide-black/[0.06]">
            {faqs.map((faq, i) => (
              <motion.div key={i} custom={i + 1} variants={fadeUp}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-medium text-[15px]">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="pb-4 text-sm text-muted-foreground leading-relaxed pr-8">
                    {faq.a}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  )
}
