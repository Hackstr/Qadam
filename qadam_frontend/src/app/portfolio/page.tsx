"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/lib/constants";
import { StatsGrid } from "@/components/qadam/stats-grid";
import { ActionRequiredBanner } from "@/components/qadam/action-required-banner";
import { PositionCard } from "@/components/qadam/position-card";
import { getCampaigns } from "@/lib/api";
import {
  Loader2, Wallet, RotateCcw, TrendingUp, Coins, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { claimTokens, claimRefund, txStatus } = useQadamProgram();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    enabled: connected,
  });

  const positions = data?.data || [];
  const totalBacked = positions.reduce((sum, p) => sum + (p.amount_lamports || 0), 0);
  const totalTokens = positions.reduce((sum, p) => sum + (p.tokens_allocated || 0), 0);
  const activePositions = positions.filter(p => p.campaign_status === "active");
  const claimableTokens = positions.reduce((sum, p) => sum + Math.max(0, (p.tokens_allocated || 0) - (p.tokens_claimed || 0)), 0);
  const pendingRefunds = positions.filter(p => p.campaign_status === "refunded" && !p.refund_claimed);

  if (!connected) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-display text-3xl tracking-tight mb-2">Your Portfolio</h1>
        <p className="text-muted-foreground mb-6">Connect your wallet to view your backed projects.</p>
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

  // Compute actions
  const actions: { text: string; href: string; type: "vote" | "claim" | "refund"; campaignId: string }[] = [];
  positions.forEach((pos) => {
    if (pos.has_active_vote) actions.push({ text: `Vote on "${pos.campaign_title}" milestone`, href: `/campaigns/${pos.campaign_id}/vote`, type: "vote", campaignId: pos.campaign_id });
    if (pos.tokens_claimed < pos.tokens_allocated && pos.campaign_status !== "refunded") actions.push({ text: `Claim share from "${pos.campaign_title}"`, href: `/portfolio`, type: "claim", campaignId: pos.campaign_id });
    if (pos.campaign_status === "refunded" && !pos.refund_claimed) actions.push({ text: `Claim refund from "${pos.campaign_title}"`, href: `/portfolio`, type: "refund", campaignId: pos.campaign_id });
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-page-enter">
      {/* Header only when user has positions */}
      {positions.length > 0 && (
        <>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-1">Your Portfolio</h1>
          <p className="text-muted-foreground mb-8">Track your backed projects, vote on milestones, claim tokens.</p>
        </>
      )}

      {/* Stats — only show when there are positions */}
      {positions.length > 0 && (
        <>
          <StatsGrid
            className="mb-8"
            items={[
              { icon: Wallet, label: "Total backed", value: formatSol(totalBacked), sublabel: `${positions.length} campaigns` },
              { icon: TrendingUp, iconColor: "text-green-500", label: "Active", value: formatSol(activePositions.reduce((s, p) => s + p.amount_lamports, 0)), valueColor: "text-green-600", sublabel: `${activePositions.length} campaigns` },
              { icon: Coins, iconColor: "text-purple-500", label: "Claimable tokens", value: claimableTokens.toLocaleString(), valueColor: "text-purple-600", sublabel: "across campaigns" },
              { icon: RotateCcw, iconColor: "text-red-400", label: "Pending refunds", value: pendingRefunds.length > 0 ? formatSol(pendingRefunds.reduce((s, p) => s + p.amount_lamports, 0)) : "0", valueColor: "text-red-500", sublabel: `${pendingRefunds.length} campaigns` },
            ]}
          />
          <ActionRequiredBanner actions={actions} className="mb-8" />
        </>
      )}

      {/* Positions */}
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-10" />
      ) : positions.length === 0 ? (
        <PortfolioEmptyState />
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-4">Active positions</h2>
          <div className="space-y-3">
            {positions.map((pos, idx) => (
              <PositionCard
                key={idx}
                position={pos}
                txBusy={txStatus !== "idle" && txStatus !== "done" && txStatus !== "error"}
                onClaimTokens={(pubkey, wallet, tokensAllocated) => {
                  claimTokens(pubkey).then(() => {
                    import("@/lib/api").then(({ syncClaimTokens }) =>
                      syncClaimTokens({ campaign_pubkey: pubkey, wallet, tokens_claimed: tokensAllocated }).catch(() => {})
                    );
                  }).catch(() => {});
                }}
                onClaimRefund={(pubkey, wallet) => {
                  claimRefund(pubkey).then(() => {
                    import("@/lib/api").then(({ syncRefund }) =>
                      syncRefund({ campaign_pubkey: pubkey, wallet }).catch(() => {})
                    );
                  }).catch(() => {});
                }}
              />
            ))}
          </div>
        </>
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

function PortfolioEmptyState() {
  // Fetch live campaigns for "Picked for you" section
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns-active"],
    queryFn: () => getCampaigns({ status: "active", limit: 3 }),
  });
  const liveCampaigns = campaignsData?.data || [];

  return (
    <div className="space-y-16 pb-20">
      {/* ── SECTION 1: Hero — NO container, plain text ── */}
      <motion.section
        initial="hidden"
        animate="visible"
      >
        <motion.p
          custom={0}
          variants={fadeUp}
          className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-4"
        >
          YOUR PORTFOLIO
        </motion.p>
        <motion.h1
          custom={1}
          variants={fadeUp}
          className="font-display text-[52px] leading-[1.05] tracking-tight mb-4"
        >
          Nothing <span className="italic">backed</span> yet.
        </motion.h1>
        <motion.p
          custom={2}
          variants={fadeUp}
          className="text-lg text-muted-foreground leading-relaxed max-w-2xl"
        >
          Once you back a project, this becomes your portfolio — votes, tokens, milestone updates, all in one place.
        </motion.p>
      </motion.section>

      {/* ── SECTION 2: CTA + Floating phantom cards ── */}
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
            STEP INTO THE ROOM
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-display text-[44px] leading-[1.08] tracking-tight mb-4"
          >
            Find projects worth{" "}
            <span className="italic text-amber-600">betting on.</span>
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-muted-foreground leading-relaxed mb-8 max-w-md"
          >
            Back with SOL, earn ownership points that compound for early backers, and vote on every milestone — your weight scales with how early you joined.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-3">
            <Link href="/discover">
              <Button className="gap-2 bg-[#1a2f23] hover:bg-[#243d2e] text-white rounded-full px-6" size="lg">
                Explore Campaigns <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/discover?view=categories">
              <Button variant="outline" className="rounded-full px-6" size="lg">
                Browse by category
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Right — floating phantom cards in grey container */}
        <motion.div custom={2} variants={fadeUp}>
          <div className="rounded-[20px] bg-secondary/50 p-6 pt-5 relative overflow-hidden min-h-[380px]">
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground mb-5">
              // PREVIEW — YOUR PORTFOLIO
            </p>
            <div className="relative h-[300px]">
              {/* Card 1 — green, top-left */}
              <div className="absolute top-0 left-0 w-[58%] h-[130px] rounded-2xl bg-[#2d6b4d] p-5 shadow-lg">
                <div className="flex items-center gap-2 mt-8">
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                  <span className="text-[11px] text-white/60 tracking-wider font-mono">project</span>
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                </div>
                <p className="text-xs text-white/50 font-mono mt-3">64% &middot; 12 SOL</p>
              </div>
              {/* Card 2 — brown/terracotta, overlapping right */}
              <div className="absolute top-[55px] right-0 w-[55%] h-[130px] rounded-2xl bg-[#a0522d] p-5 shadow-lg">
                <div className="flex items-center gap-2 mt-8">
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                  <span className="text-[11px] text-white/60 tracking-wider font-mono">project</span>
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                </div>
              </div>
              {/* Card 3 — white with Qadam "G" logo + FOUNDER badge */}
              <div className="absolute top-[130px] left-[15%] w-[40%] h-[90px] rounded-2xl bg-white border border-black/[0.06] shadow-sm flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#2d6b4d] flex items-center justify-center text-white font-display text-xl">
                  G
                </div>
                <span className="absolute top-3 right-3 text-[9px] tracking-wider font-semibold bg-[#1a2f23] text-white px-2.5 py-0.5 rounded-full">
                  FOUNDER
                </span>
              </div>
              {/* Card 4 — purple, bottom-right */}
              <div className="absolute bottom-0 right-[2%] w-[52%] h-[110px] rounded-2xl bg-[#6b3fa0] p-5 shadow-lg">
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                  <span className="text-[11px] text-white/60 tracking-wider font-mono">project</span>
                  <div className="h-px flex-1 border-t border-dashed border-white/30" />
                </div>
                <p className="text-xs text-white/50 font-mono mt-3">82% &middot; 24 SOL</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── SECTION 3: How it works — NO container, NO icons, just 3 cols ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Pick a tier", desc: "Earlier = bigger share. Founders > Early Backers > Supporters." },
            { step: "02", title: "Funds in escrow", desc: "Your SOL stays locked on-chain until the community approves the milestone." },
            { step: "03", title: "Vote & earn", desc: "Each milestone triggers a vote. Your weight is proportional to your stake." },
          ].map((item, i) => (
            <motion.div key={i} custom={i + 1} variants={fadeUp}>
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground font-semibold mb-2">{item.step}</p>
              <p className="font-display text-lg mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 4: Picked for you — live campaign cards ── */}
      {liveCampaigns.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <motion.h3 custom={0} variants={fadeUp} className="font-display text-[32px] tracking-tight">
                Picked <span className="italic">for you</span>
              </motion.h3>
              <motion.p custom={1} variants={fadeUp} className="text-muted-foreground mt-1">
                Live campaigns matching your wallet activity and Solana history.
              </motion.p>
            </div>
            <motion.div custom={1} variants={fadeUp}>
              <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                See all {liveCampaigns.length} live <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {liveCampaigns.slice(0, 3).map((c, i) => (
              <motion.div key={c.id} custom={i + 2} variants={fadeUp}>
                <Link href={`/campaigns/${c.id}`}>
                  <div className="rounded-[18px] border border-black/[0.06] overflow-hidden hover:-translate-y-0.5 transition-all duration-200">
                    {/* Cover image / color block */}
                    <div className={`h-[140px] relative ${
                      i === 0 ? "bg-[#2d6b4d]" : i === 1 ? "bg-[#a0522d]" : "bg-[#6b3fa0]"
                    }`}>
                      {c.cover_image_url && (
                        <img src={c.cover_image_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[9px] tracking-[0.1em] uppercase font-semibold bg-black/40 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                          {c.category || "PROJECT"}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-medium bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        LIVE
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      <p className="font-display text-base mb-1 truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground mb-3 font-mono">
                        {c.creator_display_name || c.creator_wallet?.slice(0, 8) + ".sol"}
                      </p>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-foreground/[0.06] mb-2">
                        <div
                          className="h-full rounded-full bg-[#1a2f23]"
                          style={{ width: `${Math.min(100, Math.round((c.raised_lamports / c.goal_lamports) * 100))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-mono font-semibold">
                          {formatSol(c.raised_lamports)} <span className="text-muted-foreground font-normal">/ {formatSol(c.goal_lamports)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── SECTION 5: FAQ — 2x2 grid, NOT accordion ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.h3 custom={0} variants={fadeUp} className="font-display text-[32px] tracking-tight mb-8">
          What backing means on Qadam
        </motion.h3>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            { q: "Where does my SOL go?", a: "Into the campaign\u2019s escrow contract on Solana mainnet. Released only when a milestone passes community vote." },
            { q: "What if the project never ships?", a: "Remaining escrow is returned to backers pro-rata. The community vote enforces this \u2014 it\u2019s not a promise, it\u2019s a contract." },
            { q: "How do tiers work?", a: "First 50 backers usually get 100% share, next 200 get 70%, the rest 50%. Each project sets its own structure." },
            { q: "How is voting weight calculated?", a: "Your weight \u2248 (your stake \u00d7 tier multiplier). Quorum is typically 20%, approval threshold 50%." },
          ].map((item, i) => (
            <motion.div key={i} custom={i + 1} variants={fadeUp} className="border-t border-foreground/10 pt-4">
              <p className="font-semibold text-[15px] mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
