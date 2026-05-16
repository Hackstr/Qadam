"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPortfolio } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/lib/constants";
import { StatsGrid } from "@/components/qadam/stats-grid";
import { ActionRequiredBanner } from "@/components/qadam/action-required-banner";
import { PositionCard } from "@/components/qadam/position-card";
import {
  Loader2, Wallet, RotateCcw,
  TrendingUp, Coins, ArrowRight, ChevronDown,
  Shield, Users, Code, Crown, Lock, Vote,
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
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "What happens to my SOL when I back?",
      a: "Your SOL goes to an on-chain escrow vault controlled by the program. It stays there until the community votes to release it milestone by milestone, or votes to refund.",
    },
    {
      q: "Can I get a refund?",
      a: "If a milestone fails, the community votes on next steps. If the vote resolves to refund, your SOL is returned proportionally from the escrow vault.",
    },
    {
      q: "What are ownership points?",
      a: "Points give you voting weight on milestone decisions. They compound for early backers — the earlier you join, the more weight you carry in governance.",
    },
  ]

  return (
    <div className="space-y-16 pb-20">
      {/* SECTION 1 — Hero */}
      <motion.section
        initial="hidden"
        animate="visible"
        className="max-w-2xl"
      >
        <div className="bg-secondary/40 rounded-[22px] p-8 md:p-10">
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground mb-4"
          >
            YOUR PORTFOLIO
          </motion.p>
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-[52px] leading-[1.05] tracking-tight mb-4"
          >
            Nothing <span className="italic text-amber-500">backed</span> yet.
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg text-muted-foreground leading-relaxed max-w-lg mb-8"
          >
            Once you back a project, this becomes your portfolio — votes, tokens, milestone updates, all in one place.
          </motion.p>
          <div className="h-px bg-foreground/10 mt-6" />
        </div>
      </motion.section>

      {/* SECTION 2 — CTA Block */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-2 gap-12 items-start"
      >
        <div>
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground mb-4 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            STEP INTO THE ROOM
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-display text-[44px] leading-[1.08] tracking-tight mb-4"
          >
            Find projects worth <span className="italic text-amber-500">betting on.</span>
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
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6" size="lg">
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

        {/* Preview card */}
        <motion.div custom={2} variants={fadeUp}>
          <div className="rounded-[18px] border border-black/[0.06] bg-white p-5 shadow-sm">
            <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-4">
              // PREVIEW — YOUR PORTFOLIO
            </p>
            <div className="space-y-3">
              {[
                { gradient: "from-emerald-100 to-teal-50", label: "DeFi Protocol", stat: "64% · 12 SOL", badge: "FOUNDER", icon: <Shield className="w-4 h-4 text-emerald-600" />, iconBg: "bg-emerald-100" },
                { gradient: "from-amber-50 to-orange-50", label: "Community DAO", stat: "32% · 4 SOL", badge: null, icon: <Users className="w-4 h-4 text-amber-600" />, iconBg: "bg-amber-100" },
                { gradient: "from-violet-50 to-purple-50", label: "Dev Tooling", stat: "88% · 20 SOL", badge: null, icon: <Code className="w-4 h-4 text-violet-600" />, iconBg: "bg-violet-100" },
              ].map((card, i) => (
                <div key={i} className={`rounded-xl bg-gradient-to-r ${card.gradient} p-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{card.label}</p>
                      <p className="text-xs text-muted-foreground">{card.stat}</p>
                    </div>
                  </div>
                  {card.badge && (
                    <span className="text-[9px] tracking-wider font-semibold bg-[#1a2f23] text-white px-2 py-0.5 rounded-full">
                      {card.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* SECTION 3 — How It Works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-3xl"
      >
        <div className="bg-secondary/40 rounded-[22px] p-8 md:p-10">
          <motion.h3 custom={0} variants={fadeUp} className="font-display text-2xl tracking-tight mb-8">
            How it works
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Pick a tier", desc: "Choose a backing tier that matches your conviction. Earlier = more ownership points.", icon: <Crown className="w-5 h-5 text-amber-500" />, iconBg: "bg-amber-50" },
              { step: "02", title: "Funds in escrow", desc: "SOL goes to an on-chain vault. Released only when the community approves milestones.", icon: <Lock className="w-5 h-5 text-green-500" />, iconBg: "bg-green-50" },
              { step: "03", title: "Vote & earn", desc: "Review evidence, cast your vote. Approved milestones release funds and mint your tokens.", icon: <Vote className="w-5 h-5 text-purple-500" />, iconBg: "bg-purple-50" },
            ].map((item, i) => (
              <motion.div key={i} custom={i + 1} variants={fadeUp}>
                <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center mb-3`}>
                  {item.icon}
                </div>
                <p className="text-[11px] tracking-[0.14em] text-amber-500 font-semibold mb-2">{item.step}</p>
                <p className="font-display text-lg mb-1">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 4 — FAQ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-2xl"
      >
        <div className="border-t border-foreground/10 pt-12">
          <motion.h3 custom={0} variants={fadeUp} className="font-display text-2xl tracking-tight">
            What backing means on Qadam
          </motion.h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Common questions from new backers</p>
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
