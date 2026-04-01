"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Cpu,
  Coins,
  Eye,
  PenLine,
  Users,
  ScanSearch,
  Banknote,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: any = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-12 pb-4 md:pt-20 md:pb-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Powered by Solana &middot; Verified by AI
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Crowdfunding where{" "}
            <span className="text-amber-500">progress</span> unlocks funding
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            SOL stays in escrow. AI verifies each milestone.
            Creators get paid for real progress. Backers become co-owners.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create">
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                Start a Campaign
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="lg" variant="outline" className="gap-2 border-black/[0.15]">
                Explore Campaigns
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works — modern connected steps */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-16 md:py-20"
      >
        <div className="container mx-auto px-4">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-center mb-14">
            How It Works
          </motion.h2>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-0">
            {[
              { icon: PenLine, title: "Create", desc: "Define project, milestones, and funding goal" },
              { icon: Users, title: "Fund", desc: "Backers send SOL to smart contract escrow" },
              { icon: ScanSearch, title: "Verify", desc: "AI evaluates evidence of milestone completion", highlight: true },
              { icon: Banknote, title: "Release", desc: "Approved? SOL transfers to creator automatically" },
            ].map((step, idx) => (
              <motion.div key={step.title} variants={fadeUp} className="relative flex flex-col items-center text-center px-4">
                {/* Connecting line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-3.5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-px bg-black/[0.08]" />
                )}

                {/* Icon — no container box, clean */}
                <div className="mb-4">
                  <step.icon className={`h-7 w-7 ${
                    step.highlight ? "text-amber-500" : "text-muted-foreground"
                  }`} />
                </div>

                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Qadam — horizontal feature rows */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="bg-zinc-50 py-16 md:py-20"
      >
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Qadam
          </motion.h2>

          <div className="space-y-8">
            {[
              { icon: Shield, title: "Milestone Escrow", desc: "Funds physically cannot leave without proof of progress. The smart contract enforces it — no trust required." },
              { icon: Cpu, title: "AI Verification", desc: "Claude AI evaluates evidence objectively in under 60 seconds. Instant, fair, transparent decisions." },
              { icon: Coins, title: "Token Equity", desc: "Backers receive project tokens proportional to their contribution. Not donors — co-owners with governance rights." },
              { icon: Eye, title: "On-chain Transparency", desc: "Every decision, every transaction, every AI verdict — publicly verifiable on Solana. Nothing hidden." },
            ].map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} className="flex gap-5 items-start">
                <feature.icon className="h-7 w-7 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="bg-[#0F1724] text-white py-14"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: "2.5%", label: "Platform fee" },
              { value: "< 60s", label: "AI verification" },
              { value: "Free", label: "For first 20 creators" },
              { value: "100%", label: "On-chain" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <p className="text-3xl font-bold text-amber-500 tabular-nums">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="py-20 text-center"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Whether you&apos;re a creator seeking funding or a backer looking for
            early-stage opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create">
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                Start a Campaign
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="lg" variant="outline" className="gap-2 border-black/[0.15]">
                Explore Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
