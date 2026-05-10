"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getAnalyticsSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/types";
import {
  ArrowRight,
  Check,
  Lock,
  Clock,
  PenLine,
  Wallet,
  Vote,
  Banknote,
} from "lucide-react";

/* ═══ Animation variants ═══ */
const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger: any = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* ═══ Helpers ═══ */
const LAMPORTS_PER_SOL = 1_000_000_000;
function lamportsToSol(l: number) {
  return (l / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

/* ═══ Inline SVG icons (stroke-only, matching prototype) ═══ */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} width="10" height="10">
      <path
        d="M2 6l3 3 5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  );
}

/* ═══ Page ═══ */
export default function Home() {
  const { data: statsData } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
    staleTime: 60_000,
  });
  const stats = statsData?.data;

  const { data: campaignsData } = useQuery({
    queryKey: ["featured-campaigns"],
    queryFn: () => getCampaigns({ status: "active", sort: "newest", limit: 3 }),
    staleTime: 60_000,
  });
  const campaigns = campaignsData?.data ?? [];

  const totalBackers = stats?.total_backers ?? 0;
  const solInEscrow = Math.round(Number(stats?.sol_in_escrow ?? 0) / LAMPORTS_PER_SOL);
  const approvedPct =
    stats && stats.total_milestones > 0
      ? Math.round((stats.approved_milestones / stats.total_milestones) * 100)
      : 0;
  const activeCampaigns = stats?.active_campaigns ?? 0;
  const totalRaisedSol = stats
    ? (stats.total_raised_lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : "0";

  return (
    <div className="flex flex-col -mt-16">
      {/* ════════════════════════════════════════════════
          HERO
         ════════════════════════════════════════════════ */}
      <section className="pt-28 pb-12">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
            {/* Left column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="pt-3"
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/[0.12]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Powered by Solana
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="font-display text-[clamp(2.5rem,5vw,4.75rem)] leading-[1.02] tracking-tight mt-5 mb-5"
              >
                Crowdfunding where{" "}
                <em className="text-amber-500 not-italic font-normal italic">
                  progress
                </em>{" "}
                unlocks funding.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg leading-relaxed text-foreground/80 max-w-[520px] mb-8"
              >
                SOL stays in escrow. Community votes on each milestone. Creators
                get paid for real progress — and backers earn a share in every
                project they support.
              </motion.p>

              <motion.div variants={fadeUp} className="flex gap-3 flex-wrap">
                <Link href="/create">
                  <Button className="gap-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5 py-3 h-auto text-[14.5px] font-semibold">
                    Start a Campaign
                    <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button
                    variant="outline"
                    className="gap-2.5 rounded-full px-5 py-3 h-auto text-[14.5px] font-semibold border-foreground/[0.1] hover:border-foreground/[0.18] hover:bg-foreground/[0.04]"
                  >
                    Explore Campaigns
                    <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </motion.div>

              {/* Trust strip under CTAs */}
              <motion.div
                variants={fadeUp}
                className="mt-9 pt-6 border-t border-foreground/10 grid grid-cols-3 gap-6 max-w-[560px]"
              >
                <div>
                  <div className="font-display text-[28px] leading-none tracking-tight">
                    <span className="text-amber-500">
                      {totalBackers.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground tracking-wide">
                    Backers on the platform
                  </div>
                </div>
                <div>
                  <div className="font-display text-[28px] leading-none tracking-tight">
                    <span className="font-mono text-[24px]">&#9702;</span>{" "}
                    {solInEscrow.toLocaleString()}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground tracking-wide">
                    SOL currently in escrow
                  </div>
                </div>
                <div>
                  <div className="font-display text-[28px] leading-none tracking-tight">
                    {approvedPct}
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground tracking-wide">
                    Milestones approved on-chain
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right column — hero visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <div className="relative aspect-[5/5.4]">
                {/* Hero illustration — no card background, clean */}
                <img
                  src="/man-in-background.png"
                  alt="Builder on Qadam"
                  className="w-full h-full object-contain object-center select-none"
                  draggable={false}
                />

                {/* Floating badge: Community Approved (top-left) */}
                <div className="absolute top-4 left-0 bg-card/90 backdrop-blur-sm border border-foreground/10 rounded-full px-3.5 py-2 flex items-center gap-2 text-[13px] font-semibold shadow-lg whitespace-nowrap -rotate-[4deg]">
                  <span className="w-[18px] h-[18px] rounded-full bg-amber-50 text-amber-500 inline-grid place-items-center">
                    <Check className="w-3 h-3" />
                  </span>
                  Community Approved
                </div>

                {/* Floating badge: Milestone 3 of 5 (bottom-right, dark) */}
                <div className="absolute bottom-12 right-0 bg-foreground/90 text-background rounded-full px-3.5 py-2 flex items-center gap-2 text-[13px] font-semibold shadow-lg whitespace-nowrap rotate-[3deg]">
                  <span className="w-2 h-2 rounded-full bg-amber-300" />
                  Milestone 3 of 5
                </div>

                {/* Escrow badge — below image */}
                <div className="flex justify-center mt-3">
                  <div className="bg-card border border-foreground/10 rounded-full px-4 py-2 flex items-center gap-2.5 text-[12px] font-medium shadow-sm whitespace-nowrap text-muted-foreground">
                    <Lock className="w-3 h-3 text-amber-500" />
                    Escrow protected
                    <span className="text-foreground/40">·</span>
                    <span className="font-mono text-[11px]">on-chain</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════════════
              TRUST BAR (dark band)
             ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-14 bg-foreground text-background rounded-[22px] px-9 py-7 grid grid-cols-1 md:grid-cols-[1.1fr_repeat(4,1fr)] gap-6 items-center"
          >
            <div className="font-display text-lg leading-snug text-background max-w-[280px]">
              Live, on-chain,{" "}
              <span className="text-amber-300">verifiable</span>. Every number
              below is queryable from any Solana RPC.
            </div>
            {[
              {
                num: `\u25E6 ${solInEscrow.toLocaleString()}`,
                lab: "Total SOL in escrow",
              },
              {
                num: String(activeCampaigns),
                lab: "Active campaigns",
              },
              {
                num: `\u25E6 ${totalRaisedSol}`,
                lab: "Released to creators",
              },
              {
                num: `${approvedPct}%`,
                lab: "Milestones approved",
              },
            ].map((cell) => (
              <div key={cell.lab}>
                <div className="font-display text-[32px] leading-none tracking-tight text-background">
                  {cell.num}
                </div>
                <div className="mt-2 text-xs text-muted-foreground tracking-wide">
                  {cell.lab}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
         ════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
        className="py-20 md:py-24 bg-secondary/60"
      >
        <div className="max-w-[1240px] mx-auto px-8">
          {/* Section header */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
          >
            <div>
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                How it works
              </span>
              <h2 className="font-display text-3xl md:text-[52px] leading-[1.05] tracking-tight mt-2 max-w-[720px]">
                Four steps.{" "}
                <em className="italic text-amber-500">Zero</em> middlemen.
              </h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-[320px]">
              Funding flows through a single Solana program. Backers approve
              milestones. Creators get paid only when work is verified.
            </p>
          </motion.div>

          {/* Steps grid */}
          <div className="relative mt-10">
            {/* Dashed connecting line */}
            <div
              className="hidden md:block absolute left-[6%] right-[6%] top-[38px] h-px z-0"
              style={{
                background:
                  "repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 12px)",
                opacity: 0.25,
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
              {[
                {
                  num: "01",
                  title: "Create",
                  desc: "Define your project, milestones, and funding goal on Solana.",
                  icon: PenLine,
                },
                {
                  num: "02",
                  title: "Fund",
                  desc: "Backers send SOL directly to the smart contract escrow.",
                  icon: Wallet,
                },
                {
                  num: "03",
                  title: "Vote",
                  desc: "Backers vote on-chain to approve or reject each milestone.",
                  icon: Vote,
                },
                {
                  num: "04",
                  title: "Release",
                  desc: "Approved? SOL transfers to the creator automatically.",
                  icon: Banknote,
                },
              ].map((step) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  className="relative z-10 px-6"
                >
                  <div className="w-[76px] h-[76px] bg-card border border-foreground/10 rounded-full grid place-items-center font-display text-[28px] mx-auto shadow-[0_10px_24px_-16px_rgba(22,32,26,0.25)]">
                    <em className="italic text-amber-500">{step.num}</em>
                  </div>
                  <h4 className="font-display text-[22px] font-medium text-center mt-5 mb-2 tracking-tight">
                    {step.title}
                  </h4>
                  <p className="text-center text-sm text-muted-foreground mx-auto max-w-[220px] leading-relaxed">
                    {step.desc}
                  </p>
                  <div className="mt-3.5 mx-auto w-8 h-8 rounded-lg border border-foreground/10 grid place-items-center text-foreground/80">
                    <step.icon className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          WHY QADAM — alternating feature blocks
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24">
        <div className="max-w-[1240px] mx-auto px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6"
          >
            <div>
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                Why Qadam
              </span>
              <h2 className="font-display text-3xl md:text-[52px] leading-[1.05] tracking-tight mt-2 max-w-[720px]">
                Crowdfunding, but{" "}
                <em className="italic text-amber-500">accountable</em>.
              </h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-[320px]">
              Three principles enforced by code, not policy.
            </p>
          </motion.div>

          {/* BLOCK 1: Escrow */}
          <FeatureBlock
            eyebrow="No more broken promises"
            headline={
              <>
                Funds locked until{" "}
                <em className="italic text-amber-500">real</em> progress is
                proven.
              </>
            }
            body="Too many projects raise money and disappear. Qadam holds every SOL in a smart contract — releases happen only after each milestone is approved. If a creator doesn't deliver, backers get refunded automatically."
            points={[
              "Funds split per milestone, not in one lump sum",
              "Auto-refund if a milestone is rejected",
              "Audited by OtterSec . contract is open source",
            ]}
            visual={<EscrowVisual />}
          />

          {/* BLOCK 2: Voting (flipped) */}
          <FeatureBlock
            flip
            eyebrow="Community decides — not a platform"
            headline={
              <>
                Every milestone{" "}
                <em className="italic text-amber-500">voted</em> by the people
                who funded it.
              </>
            }
            body="No hidden algorithms. No opaque review process. Backers see the deliverables, ask questions in the comment thread, and cast a vote weighted by their contribution. You backed it — you vote."
            points={[
              "Vote weight from contribution, not wallet count",
              "72-hour vote window per milestone",
              "Every vote stamped on Solana, queryable forever",
            ]}
            visual={<VotingVisual />}
          />

          {/* BLOCK 3: Ownership */}
          <FeatureBlock
            eyebrow="Backers become co-owners"
            headline={
              <>
                You don&apos;t just donate — you{" "}
                <em className="italic text-amber-500">earn</em> ownership.
              </>
            }
            body="Every contribution mints non-transferable Ownership Points. Founder-tier backers earn the most and unlock voting weight on key decisions: future milestones, product direction, even revenue-share unlocks once a project ships."
            points={[
              "Three tiers: Founder, Patron, Supporter",
              "No equity dilution, no geography limits",
              "Revenue-share unlocks once milestones ship",
            ]}
            visual={<OwnershipVisual />}
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURED CAMPAIGNS
         ════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
        className="py-20 md:py-24"
      >
        <div className="max-w-[1240px] mx-auto px-8">
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
          >
            <div>
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                Live now
              </span>
              <h2 className="font-display text-3xl md:text-[52px] leading-[1.05] tracking-tight mt-2">
                Projects funding{" "}
                <em className="italic text-amber-500">this week</em>.
              </h2>
            </div>
            <Link href="/campaigns">
              <Button
                variant="outline"
                className="gap-2 rounded-full px-4 py-2.5 h-auto text-[13px] font-semibold border-foreground/[0.1]"
              >
                All campaigns
                <ArrowIcon />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {campaigns.length > 0
              ? campaigns.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} colorIdx={i} />
                ))
              : /* Placeholder cards when no data */
                [0, 1, 2].map((i) => (
                  <PlaceholderCampaignCard key={i} idx={i} />
                ))}
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          PATH CARDS — For Creators / For Backers
         ════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
        className="py-6 md:py-12 pb-20 md:pb-24"
      >
        <div className="max-w-[1240px] mx-auto px-8">
          <motion.div
            variants={fadeUp}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-7"
          >
            <div>
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                Pick your side
              </span>
              <h2 className="font-display text-3xl md:text-[52px] leading-[1.05] tracking-tight mt-2">
                Build something — or back{" "}
                <em className="italic text-amber-500">somebody</em>.
              </h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* For Creators */}
            <motion.div
              variants={fadeUp}
              className="rounded-[22px] p-9 border border-foreground/10 bg-card flex flex-col min-h-[320px]"
            >
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                For Creators
              </span>
              <h4 className="font-display text-[32px] leading-[1.1] tracking-tight mt-3 mb-3.5">
                Get funded without losing{" "}
                <em className="italic text-amber-500">control</em>.
              </h4>
              <p className="text-[14.5px] leading-relaxed text-foreground/80 max-w-[360px] mb-6">
                Structured milestones. Community backing. No VC, no equity
                dilution, no geography limits. Ship on your terms — get paid
                when each milestone is approved.
              </p>
              <div className="mt-auto">
                <Link href="/create">
                  <Button className="gap-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5 py-3 h-auto text-[14.5px] font-semibold">
                    Start a Campaign
                    <ArrowIcon />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* For Backers */}
            <motion.div
              variants={fadeUp}
              className="rounded-[22px] p-9 bg-foreground text-background flex flex-col min-h-[320px]"
            >
              <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                For Backers
              </span>
              <h4 className="font-display text-[32px] leading-[1.1] tracking-tight mt-3 mb-3.5 text-background">
                Back early. Vote often. Earn{" "}
                <em className="italic text-amber-300">ownership</em>.
              </h4>
              <p className="text-[14.5px] leading-relaxed text-foreground/60 max-w-[360px] mb-6">
                Funds sit safely in escrow. You vote on progress. If a project
                doesn&apos;t deliver, you get refunded. If it ships — you carry
                ownership points.
              </p>
              <div className="mt-auto">
                <Link href="/campaigns">
                  <Button className="gap-2.5 bg-secondary hover:bg-card text-foreground rounded-full px-5 py-3 h-auto text-[14.5px] font-semibold border-transparent">
                    Explore Campaigns
                    <ArrowIcon />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════
          FOOTER (landing-specific, richer than layout footer)
         ════════════════════════════════════════════════ */}
      <footer className="border-t border-foreground/10 pt-14 pb-8 mt-4">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-14">
            {/* Brand */}
            <div>
              <h3 className="font-display text-[28px] tracking-tight mb-3.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Qadam
              </h3>
              <p className="text-sm text-muted-foreground max-w-[360px] mb-4">
                Community-governed crowdfunding on Solana. Built step by step —
                funds released only when work is verified.
              </p>
              <div className="inline-flex items-center gap-2.5 px-3 py-2 border border-foreground/10 rounded-[10px] bg-card font-mono text-xs text-foreground/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(45,95,78,0.15)]" />
                Program . Qa1mProgxxx...ZpKt . Audited by OtterSec
              </div>
            </div>

            {/* Product */}
            <div>
              <h6 className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-3.5">
                Product
              </h6>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/campaigns"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Discover
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Start a campaign
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/analytics"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h6 className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-3.5">
                Developers
              </h6>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Hackstr/Qadam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Smart contract
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Audit report
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Hackstr/Qadam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h6 className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-bold mb-3.5">
                Community
              </h6>
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    X / Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-foreground/80 hover:text-amber-500 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-foreground/10 text-xs text-muted-foreground font-mono gap-4">
            <div>Qadam . Build step by step</div>
            <div className="flex gap-4 flex-wrap">
              <span>Powered by Solana</span>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <span>&copy; 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Feature block component (alternating layout)
   ═══════════════════════════════════════════════════════════ */
function FeatureBlock({
  eyebrow,
  headline,
  body,
  points,
  visual,
  flip = false,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
  points: string[];
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-14 border-t border-foreground/10 first:border-t-0`}
    >
      <div className={flip ? "lg:order-2" : ""}>
        <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
          {eyebrow}
        </span>
        <h3 className="font-display text-2xl md:text-[44px] leading-[1.05] tracking-tight mt-3.5 mb-4 max-w-[460px]">
          {headline}
        </h3>
        <p className="text-foreground/80 text-[16.5px] leading-relaxed max-w-[440px] mb-5">
          {body}
        </p>
        <ul className="flex flex-col gap-2.5">
          {points.map((pt) => (
            <li key={pt} className="flex gap-3 text-[14.5px] text-foreground/80">
              <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-amber-50 text-amber-500 grid place-items-center mt-0.5">
                <CheckIcon />
              </span>
              {pt}
            </li>
          ))}
        </ul>
      </div>
      <div>{visual}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Escrow visualization card
   ═══════════════════════════════════════════════════════════ */
function EscrowVisual() {
  const rows = [
    { ms: "M1 . Prototype", sub: "Released . 12 Apr", amt: "\u25E6 480", status: "released" as const },
    { ms: "M2 . Optics", sub: "Released . 02 May", amt: "\u25E6 720", status: "released" as const },
    { ms: "M3 . Beta units", sub: "Voting . ends in 2d 14h", amt: "\u25E6 1,200", status: "pending" as const },
    { ms: "M4 . Production", sub: "Locked", amt: "\u25E6 1,800", status: "locked" as const },
  ];

  return (
    <div className="bg-card border border-foreground/10 rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_22px_44px_-28px_rgba(22,32,26,0.14)] overflow-hidden">
      <div className="flex justify-between items-center mb-3.5">
        <div className="font-display text-lg">Lumen Studio Camera</div>
        <div className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          campaign . 8f2e...a1c4
        </div>
      </div>
      {rows.map((r) => {
        const bgClass =
          r.status === "released"
            ? "bg-amber-50 border-amber-500/[0.18]"
            : "bg-background border-foreground/10";
        const iconBg =
          r.status === "released"
            ? "bg-amber-500"
            : r.status === "pending"
              ? "bg-[var(--mustard)]"
              : "bg-foreground";
        return (
          <div
            key={r.ms}
            className={`flex items-center gap-3 px-3.5 py-3 border rounded-xl mb-2.5 text-[13px] ${bgClass}`}
          >
            <div
              className={`w-7 h-7 rounded-lg ${iconBg} text-background grid place-items-center`}
            >
              {r.status === "released" ? (
                <Check className="w-3 h-3" />
              ) : r.status === "pending" ? (
                <Clock className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{r.ms}</div>
              <div className="text-xs text-muted-foreground">{r.sub}</div>
            </div>
            <div className="font-mono text-[13px] whitespace-nowrap">{r.amt}</div>
          </div>
        );
      })}
      {/* Progress bar */}
      <div className="mt-4 h-1.5 rounded bg-foreground/[0.06] overflow-hidden">
        <div className="h-full w-[65%] bg-gradient-to-r from-amber-500 to-amber-600 rounded" />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-muted-foreground font-mono">
        <span>\u25E6 1,200 of \u25E6 4,200 released</span>
        <span>65% funded</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Voting visualization card
   ═══════════════════════════════════════════════════════════ */
function VotingVisual() {
  const voters = [
    { name: "azimov.sol", vote: "approve", gradient: "from-[#C8923A] to-[#C2532E]" },
    { name: "veridian.sol", vote: "approve", gradient: "from-amber-600 to-[#6BD49B]" },
    { name: "m1ngus.sol", vote: "approve", gradient: "from-[#4A6FA5] to-[#9CB3D9]" },
    { name: "helix.sol", vote: "reject", gradient: "from-[#8B4A8B] to-[#C58FC5]" },
  ];

  return (
    <div className="bg-card border border-foreground/10 rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_22px_44px_-28px_rgba(22,32,26,0.14)] overflow-hidden">
      <div className="flex justify-between items-center mb-3.5">
        <div className="font-display text-lg">Milestone 3 . Beta units</div>
        <div className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          vote . open
        </div>
      </div>
      {voters.map((v) => (
        <div
          key={v.name}
          className="flex items-center gap-3 px-3.5 py-2.5 border border-foreground/10 rounded-full mb-2 text-[13px] bg-background"
        >
          <div
            className={`w-[26px] h-[26px] rounded-full bg-gradient-to-br ${v.gradient}`}
          />
          <div className="flex-1 font-medium">{v.name}</div>
          <span
            className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
              v.vote === "approve"
                ? "text-amber-500 bg-amber-50"
                : "text-[var(--terracotta)] bg-[var(--terracotta)]/10"
            }`}
          >
            {v.vote}
          </span>
        </div>
      ))}
      {/* Tally */}
      <div className="mt-4 px-3.5 py-3.5 border border-dashed border-foreground/10 rounded-xl flex justify-between items-center">
        <div>
          <div className="font-display text-[26px] text-amber-500">87.3%</div>
          <div className="text-xs text-muted-foreground">
            Approve . 1,082 of 1,240 voted
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-foreground/80 whitespace-nowrap">
            2d 14h 22m
          </div>
          <div className="text-[11px] text-muted-foreground">left to vote</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ownership points visualization card
   ═══════════════════════════════════════════════════════════ */
function OwnershipVisual() {
  const cards = [
    { tier: "Founder . Lumen Camera", pts: 2400, pct: 92, founder: true },
    { tier: "Patron . Solar Almanac", pts: 880, pct: 58, founder: false },
    { tier: "Supporter . Meadow Records", pts: 240, pct: 24, founder: false },
  ];

  return (
    <div className="bg-card border border-foreground/10 rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_22px_44px_-28px_rgba(22,32,26,0.14)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-3.5">
        <div className="font-display text-lg">Your ownership</div>
        <div className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          3 projects backed
        </div>
      </div>
      {cards.map((c) => (
        <div
          key={c.tier}
          className={`border rounded-[14px] p-4 mb-3 ${
            c.founder
              ? "bg-amber-50 border-amber-500/[0.18]"
              : "bg-background border-foreground/10"
          }`}
        >
          <div className="flex justify-between items-baseline mb-3 gap-3">
            <span className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground font-semibold truncate">
              {c.tier}
            </span>
            <span className="font-display text-[22px] whitespace-nowrap">
              <em className="italic text-amber-500 not-italic">
                {c.pts.toLocaleString()}
              </em>{" "}
              pts
            </span>
          </div>
          <div className="h-1 bg-foreground/[0.06] rounded overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded"
              style={{ width: `${c.pct}%` }}
            />
          </div>
        </div>
      ))}
      {/* Total */}
      <div className="mt-3.5 px-3.5 py-3 bg-amber-500 text-white rounded-xl flex justify-between items-center">
        <div>
          <div className="font-display text-lg">3,520 pts total</div>
          <div className="text-[11px] text-white/70 tracking-wide">
            Voting weight: 0.84%
          </div>
        </div>
        <Link href="/portfolio">
          <Button className="bg-secondary hover:bg-card text-foreground rounded-full px-3.5 py-2 h-auto text-xs font-semibold border-transparent">
            Claim rewards &rarr;
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Campaign card (real data)
   ═══════════════════════════════════════════════════════════ */
const THUMB_GRADIENTS = [
  "from-[#C8923A] to-[#C2532E]",
  "from-amber-600 to-[#6BD49B]",
  "from-[#4A4F66] to-[#9CB3D9]",
];

function CampaignCard({
  campaign,
  colorIdx,
}: {
  campaign: Campaign;
  colorIdx: number;
}) {
  const pct =
    campaign.goal_lamports > 0
      ? Math.min(
          100,
          Math.round(
            (campaign.raised_lamports / campaign.goal_lamports) * 100
          )
        )
      : 0;

  const milestones = campaign.milestones ?? [];
  const msCount = campaign.milestones_count || milestones.length || 4;
  const msApproved = campaign.milestones_approved || 0;
  // Determine current milestone (first non-approved)
  const msCurrent = msApproved < msCount ? msApproved : msCount - 1;

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/campaigns/${campaign.id}`}>
        <div className="bg-card border border-foreground/10 rounded-[18px] p-4.5 flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(22,32,26,0.18)] group">
          {/* Thumbnail */}
          <div
            className={`relative aspect-[16/10] rounded-xl mb-3.5 overflow-hidden bg-gradient-to-br ${THUMB_GRADIENTS[colorIdx % 3]}`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(135deg, transparent 0 10px, rgba(22,32,26,0.04) 10px 11px)",
              }}
            />
            {campaign.cover_image_url && (
              <img
                src={campaign.cover_image_url}
                alt={campaign.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {campaign.category && (
              <span className="absolute top-3 left-3 bg-card/[0.92] backdrop-blur-sm text-foreground/80 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {campaign.category}
              </span>
            )}
          </div>

          <h5 className="font-display text-xl font-medium leading-snug mb-1.5">
            {campaign.title}
          </h5>
          {campaign.description && (
            <p className="text-[13.5px] text-muted-foreground leading-snug mb-3.5 line-clamp-2">
              {campaign.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="h-1 bg-foreground/[0.06] rounded overflow-hidden mb-2">
            <div
              className="h-full bg-amber-500 rounded"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Milestone pips */}
          <div className="flex gap-1 mt-1">
            {Array.from({ length: msCount }).map((_, j) => (
              <span
                key={j}
                className={`flex-1 h-1 rounded-sm ${
                  j < msApproved
                    ? "bg-amber-500"
                    : j === msCurrent
                      ? "bg-[var(--mustard)]"
                      : "bg-foreground/10"
                }`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-between mt-3.5 font-mono text-xs text-foreground/80">
            <span>
              <span className="font-semibold text-foreground">
                \u25E6 {lamportsToSol(campaign.raised_lamports)}
              </span>{" "}
              / {lamportsToSol(campaign.goal_lamports)}
            </span>
            <span>{campaign.backers_count} backers</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Placeholder campaign card (no data)
   ═══════════════════════════════════════════════════════════ */
function PlaceholderCampaignCard({ idx }: { idx: number }) {
  const placeholders = [
    {
      title: "Lumen Studio Camera",
      desc: "Open-source mirrorless body, fully serviceable, made in Lisbon.",
      tag: "Hardware",
      raised: "\u25E6 2,730",
      goal: "4,200",
      backers: 1240,
      pct: 65,
      pips: [true, true, false, false, false],
      currentPip: 2,
    },
    {
      title: "Solar Almanac . Vol. 2",
      desc: "A printed almanac of solar weather, indie typography, and field notes.",
      tag: "Publishing",
      raised: "\u25E6 1,760",
      goal: "2,000",
      backers: 612,
      pct: 88,
      pips: [true, true, true, false],
      currentPip: 3,
    },
    {
      title: "Meadow Records DAW",
      desc: "Distraction-free music production, built for laptops and slow internet.",
      tag: "Software",
      raised: "\u25E6 980",
      goal: "3,000",
      backers: 284,
      pct: 32,
      pips: [true, false, false, false, false, false],
      currentPip: 1,
    },
  ];
  const p = placeholders[idx % 3];

  return (
    <motion.div variants={fadeUp}>
      <div className="bg-card border border-foreground/10 rounded-[18px] p-4.5 flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(22,32,26,0.18)]">
        <div
          className={`relative aspect-[16/10] rounded-xl mb-3.5 overflow-hidden bg-gradient-to-br ${THUMB_GRADIENTS[idx % 3]}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(135deg, transparent 0 10px, rgba(22,32,26,0.04) 10px 11px)",
            }}
          />
          <span className="absolute top-3 left-3 bg-card/[0.92] backdrop-blur-sm text-foreground/80 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {p.tag}
          </span>
        </div>

        <h5 className="font-display text-xl font-medium leading-snug mb-1.5">
          {p.title}
        </h5>
        <p className="text-[13.5px] text-muted-foreground leading-snug mb-3.5">
          {p.desc}
        </p>

        <div className="h-1 bg-foreground/[0.06] rounded overflow-hidden mb-2">
          <div
            className="h-full bg-amber-500 rounded"
            style={{ width: `${p.pct}%` }}
          />
        </div>

        <div className="flex gap-1 mt-1">
          {p.pips.map((done, j) => (
            <span
              key={j}
              className={`flex-1 h-1 rounded-sm ${
                done
                  ? "bg-amber-500"
                  : j === p.currentPip
                    ? "bg-[var(--mustard)]"
                    : "bg-foreground/10"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-3.5 font-mono text-xs text-foreground/80">
          <span>
            <span className="font-semibold text-foreground">{p.raised}</span> /{" "}
            {p.goal}
          </span>
          <span>{p.backers} backers</span>
        </div>
      </div>
    </motion.div>
  );
}
