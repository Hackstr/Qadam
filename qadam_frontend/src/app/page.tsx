"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns, getAnalyticsSummary } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { formatSol } from "@/lib/constants";
import {
  ArrowRight, Shield, Coins, Eye,
  PenLine, Users, Banknote,
  CheckCircle, Lock, Zap, ChevronDown,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0.3, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: any = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};



export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Ticker — slight diagonal, behind header */}
      <div className="relative z-40 mt-16">
        <div className="bg-amber-500 text-white py-2 -rotate-[1.5deg] scale-x-[1.15]">
          <div className="animate-marquee whitespace-nowrap flex gap-8">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="flex gap-8 text-[11px] font-medium tracking-widest uppercase">
                <span>Devnet Testing</span>
                <span className="opacity-30">*</span>
                <span className="font-extrabold">National Solana Hackathon</span>
                <span className="opacity-30">*</span>
                <span>Community Governed Crowdfunding</span>
                <span className="opacity-30">*</span>
                <span>Milestone Escrow on Solana</span>
                <span className="opacity-30">*</span>
                <span>Backers Become Co-Owners</span>
                <span className="opacity-30">*</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero — dot grid + split layout */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-16 pb-8 md:pt-24 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left — text */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Powered by Solana
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-display text-3xl sm:text-5xl md:text-7xl tracking-tight leading-[1.1] mb-6"
              >
                Crowdfunding where{" "}
                <span className="text-amber-500">progress</span>{" "}
                unlocks funding
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
              >
                SOL stays in escrow. Community votes on each milestone.
                Creators get paid for real progress. Backers earn a share in every project they support.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Link href="/create">
                  <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                    Start a Campaign
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/campaigns">
                  <Button size="lg" variant="outline" className="gap-2 border-black/[0.15] rounded-full">
                    Explore Campaigns
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — illustration */}
            <motion.div
              initial={{ opacity: 0.3, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:flex items-center justify-center py-4"
            >
              <div className="relative w-full max-w-md">
                {/* Ambient glow */}
                <div className="absolute inset-0 -m-12 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

                {/* Floating badge — Community Verified */}
                <div className="absolute top-8 -left-4 z-10 bg-white/90 backdrop-blur-xl border border-white/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg -rotate-[6deg]">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-700">Community Approved</span>
                </div>

                {/* Floating badge — Escrow */}
                <div className="absolute bottom-12 -right-2 z-10 bg-[#0F1724]/90 text-white border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg rotate-[4deg]">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold">Escrow protected</span>
                </div>

                {/* Illustration */}
                <img
                  src="/man-in-background.png"
                  alt="Builder on Qadam"
                  className="relative w-full h-auto object-contain select-none" style={{ mixBlendMode: "multiply" }}
                  draggable={false}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="border-y border-black/[0.04] bg-white/50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            Funds in on-chain escrow
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Community governance
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Built on Solana
          </span>
        </div>
      </div>

      {/* How It Works — numbered cards */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-16 md:py-24"
      >
        <div className="container mx-auto px-4">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl tracking-tight text-center mb-16">
            How It Works
          </motion.h2>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: "01", icon: PenLine, title: "Create", desc: "Define your project, milestones, and funding goal on Solana" },
              { num: "02", icon: Users, title: "Fund", desc: "Backers send SOL directly to smart contract escrow" },
              { num: "03", icon: Users, title: "Community Votes", desc: "Backers vote on-chain to approve or reject milestone completion", highlight: true },
              { num: "04", icon: Banknote, title: "Release", desc: "Approved? SOL transfers to creator automatically" },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className={`rounded-2xl p-6 border ${
                  step.highlight
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white border-black/[0.06]"
                }`}
              >
                <span className={`text-3xl font-bold block mb-4 ${step.highlight ? "text-white/40" : "text-amber-500/30"}`}>
                  {step.num}
                </span>
                <step.icon className={`h-6 w-6 mb-3 ${step.highlight ? "text-white" : "text-foreground"}`} />
                <h3 className={`font-semibold mb-1 ${step.highlight ? "text-white" : ""}`}>{step.title}</h3>
                <p className={`text-sm leading-relaxed ${step.highlight ? "text-white/80" : "text-muted-foreground"}`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Qadam — 2-column grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-16 md:py-24"
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl tracking-tight text-center mb-12">
            Why Qadam
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "Milestone Escrow", desc: "Funds physically cannot leave without proof of progress. The smart contract enforces it — no trust required." },
              { icon: Users, title: "Community Governance", desc: "Backers vote on every milestone approval, extension, and refund. Decisions are on-chain, transparent, and final." },
              { icon: Coins, title: "Backer Ownership", desc: "Your contribution earns you ownership points in the project. Earlier backers earn more. Vote on key decisions." },
              { icon: Eye, title: "On-chain Transparency", desc: "Every vote, every transaction, every release — publicly verifiable on Solana. Nothing hidden." },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="bg-white border border-black/[0.06] rounded-2xl p-6 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Story blocks — MindMarket style */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl space-y-16">
          {[
            {
              headline: "No more broken promises.",
              body: "Too many projects raise money and disappear. Qadam locks funds in a smart contract until real progress is proven. If a creator doesn't deliver — backers get their SOL back.",
            },
            {
              headline: "Community decides, not a platform.",
              body: "Every milestone is voted by the people who funded it. No hidden algorithms. No opaque review process. You backed it — you vote.",
            },
            {
              headline: "Backers become co-owners.",
              body: "When you fund a project, you don't just donate — you earn ownership points. Founders tier backers earn the most. Vote on key decisions together.",
            },
          ].map((block, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`${i % 2 === 0 ? "text-left" : "text-right"}`}
            >
              <h3 className="font-display text-2xl md:text-4xl tracking-tight mb-4">{block.headline}</h3>
              <p className={`text-muted-foreground text-lg leading-relaxed max-w-2xl ${i % 2 === 0 ? "" : "ml-auto"}`}>
                {block.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For Creators / For Backers */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-16"
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} className="border border-black/[0.06] rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-2">For Creators</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Get funded without losing control. Structured milestones. Community backing.
                No VC, no equity dilution, no geography limits.
              </p>
              <Link href="/create">
                <Button variant="outline" className="gap-1.5">
                  Start a Campaign <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="border border-black/[0.06] rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-2">For Backers</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Back early projects, safely. Funds in escrow. You vote on progress.
                Refunds if things don't work out.
              </p>
              <Link href="/campaigns">
                <Button variant="outline" className="gap-1.5">
                  Explore Campaigns <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Active Campaigns */}
      <ActiveCampaignsSection />

      {/* Stats — light, with border cards */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-16"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: "2.5%", label: "Platform fee", sub: "vs 8-10% on Kickstarter" },
              { value: "On-chain", label: "Community votes", sub: "Transparent governance" },
              { value: "Creator-set", label: "Tier structure", sub: "1-10 tiers, you decide" },
              { value: "100%", label: "Verifiable", sub: "Every tx on Solana Explorer" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="text-center border border-black/[0.06] rounded-2xl py-8 px-4"
              >
                <p className="text-3xl md:text-4xl font-bold text-amber-500 tabular-nums">{stat.value}</p>
                <p className="text-sm font-medium text-foreground mt-2">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ preview */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl tracking-tight text-center mb-8">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "How does escrow work?", a: "Your SOL goes directly into a smart contract on Solana — not to the creator. Released only when community votes to approve each milestone." },
              { q: "What if a milestone fails?", a: "Backers vote on-chain — either extend the deadline or trigger a proportional refund. The smart contract enforces the outcome automatically." },
              { q: "What do I get as a backer?", a: "Ownership points proportional to your contribution. Founders tier earns 1.0 points per SOL. You also get governance rights — vote on every milestone decision." },
            ].map((faq, i) => (
              <details key={i} className="group border border-black/[0.06] rounded-xl">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-sm">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/faq" className="text-sm text-amber-600 hover:underline">See all FAQ →</Link>
          </div>
        </div>
      </section>

      {/* CTA — clean, centered */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeUp}
        className="py-24 text-center"
      >
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-4">
            Ready to build?
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Whether you are a creator seeking funding or a backer
            looking for early-stage opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                Start a Campaign
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="lg" variant="outline" className="gap-2 border-black/[0.15] rounded-full">
                Explore Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function ActiveCampaignsSection() {
  const { data } = useQuery({
    queryKey: ["landing-campaigns"],
    queryFn: () => getCampaigns({ status: "active", sort: "trending", limit: 6 }),
    retry: false,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
    retry: false,
  });

  const campaigns = data?.data || [];
  if (campaigns.length === 0) return null;

  const stats = analyticsData?.data;
  const totalRaised = stats ? Number(stats.total_raised_lamports) : campaigns.reduce((s, c) => s + c.raised_lamports, 0);
  const totalBackers = stats?.total_backers ?? campaigns.reduce((s, c) => s + c.backers_count, 0);
  const activeCampaigns = stats?.active_campaigns ?? campaigns.length;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={stagger}
      className="py-16"
    >
      <div className="container mx-auto px-4">
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-tight">Live on Qadam</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCampaigns} campaigns · {formatSol(totalRaised)} raised · {totalBackers} backers
            </p>
          </div>
          <Link href="/campaigns" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all &rarr;
          </Link>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.slice(0, 6).map((campaign) => (
            <motion.div key={campaign.id} variants={fadeUp}>
              <CampaignCard campaign={campaign} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
