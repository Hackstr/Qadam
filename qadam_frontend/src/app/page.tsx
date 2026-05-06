"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, PenLine, Users, Banknote,
  CheckCircle, Lock,
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
      {/* ═══ TICKER ═══ */}
      <div className="relative z-40 mt-16">
        <div className="bg-amber-500 text-white py-4 -rotate-[1.5deg] -mx-4 px-4 overflow-hidden">
          <div className="flex whitespace-nowrap animate-ticker">
            {[0, 1].map((group) => (
              <div key={group} className="flex shrink-0" aria-hidden={group === 1}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="inline-flex items-center gap-5 text-[12px] tracking-widest uppercase px-5">
                    <span className="font-extrabold text-[13px]">Colosseum Frontier</span>
                    <span className="text-white/50">·</span>
                    <span className="font-medium">Community Governed Crowdfunding</span>
                    <span className="text-white/50">·</span>
                    <span className="font-medium">Milestone Escrow on Solana</span>
                    <span className="text-white/50">·</span>
                    <span className="font-medium">Backers Become Co-Owners</span>
                    <span className="text-white/50">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-16 pb-8 md:pt-24 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
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

            <motion.div
              initial={{ opacity: 0.3, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:flex items-center justify-center py-4"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 -m-12 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />

                <div className="absolute top-8 -left-4 z-10 bg-white/90 backdrop-blur-xl border border-white/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg -rotate-[6deg]">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-amber-700">Community Approved</span>
                </div>

                <div className="absolute bottom-12 -right-2 z-10 bg-foreground/90 text-white border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg rotate-[4deg]">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold">Escrow protected</span>
                </div>

                <img
                  src="/man-in-background.png"
                  alt="Builder on Qadam"
                  className="relative w-full h-auto object-contain select-none"
                  style={{ mixBlendMode: "multiply" }}
                  draggable={false}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-20 md:py-28"
      >
        <div className="container mx-auto px-4">
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-5xl tracking-tight text-center mb-16">
            How It Works
          </motion.h2>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { num: "01", icon: PenLine, title: "Create", desc: "Define your project, milestones, and funding goal on Solana" },
              { num: "02", icon: Users, title: "Fund", desc: "Backers send SOL directly to smart contract escrow" },
              { num: "03", icon: Users, title: "Community Votes", desc: "Backers vote on-chain to approve or reject milestone completion", highlight: true },
              { num: "04", icon: Banknote, title: "Release", desc: "Approved? SOL transfers to creator automatically" },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className={`rounded-2xl p-7 border transition-shadow hover:shadow-lg ${
                  step.highlight
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white border-black/[0.06]"
                }`}
              >
                <span className={`text-4xl font-bold block mb-5 ${step.highlight ? "text-white/30" : "text-amber-500/20"}`}>
                  {step.num}
                </span>
                <step.icon className={`h-6 w-6 mb-3 ${step.highlight ? "text-white" : "text-foreground"}`} />
                <h3 className={`font-semibold text-lg mb-2 ${step.highlight ? "text-white" : ""}`}>{step.title}</h3>
                <p className={`text-sm leading-relaxed ${step.highlight ? "text-white/80" : "text-muted-foreground"}`}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══ STORY BLOCKS ═══ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-4xl space-y-20">
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

      {/* ═══ FOR CREATORS / FOR BACKERS (CTA) ═══ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={stagger}
        className="py-20 md:py-28"
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">For Creators</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Get funded without losing control. Structured milestones. Community backing.
                No VC, no equity dilution, no geography limits.
              </p>
              <Link href="/create">
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                  Start a Campaign <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-white border border-black/[0.06] rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">For Backers</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Back early projects, safely. Funds in escrow. You vote on progress.
                Refunds if things don't work out.
              </p>
              <Link href="/campaigns">
                <Button variant="outline" className="gap-2 rounded-full">
                  Explore Campaigns <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
