"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Shield, Cpu, Coins, Eye,
  PenLine, Users, ScanSearch, Banknote,
  CheckCircle, Lock,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger: any = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// Mock campaign card for hero visual
function HeroCampaignMock() {
  return (
    <div className="relative select-none">
      {/* Floating badge 1 — AI Verified */}
      <div className="absolute -top-5 left-4 z-10 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm -rotate-[6deg]">
        <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[11px] font-semibold text-amber-700">AI Verified in 23s</span>
      </div>

      {/* Floating badge 2 — Escrow */}
      <div className="absolute -bottom-4 right-2 z-10 bg-[#0F1724]/90 text-white border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md rotate-[4deg]">
        <Lock className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-semibold">Escrow protected</span>
      </div>

      {/* Campaign card */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.10)] -rotate-[1deg]">
        {/* Cover gradient */}
        <div className="h-28 flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)" }}>
          <Cpu className="h-10 w-10 text-white/70" />
          <span className="absolute top-3 left-3 text-[9px] font-medium uppercase tracking-widest text-white/50">Apps</span>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] text-white/80">Active</span>
          </div>
        </div>
        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-[14px] leading-snug mb-1">Nomad Finance App</h3>
          <p className="text-[11px] text-muted-foreground mb-3">Banking for remote workers. 40+ countries.</p>
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold">37.50 SOL</span>
              <span className="text-muted-foreground">of 50.00 SOL</span>
            </div>
            <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04]">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> 42 backers
            </span>
            <span className="text-[11px] font-medium text-green-500">Genesis</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero — split layout */}
      <section className="container mx-auto px-4 pt-16 pb-6 md:pt-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left — text */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Powered by Solana · Verified by AI
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6"
            >
              Crowdfunding where{" "}
              <span className="text-amber-500">progress</span>{" "}
              unlocks funding
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
            >
              SOL stays in escrow. AI verifies each milestone.
              Creators get paid for real progress. Backers become co-owners.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
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

          {/* Right — campaign mock + floating badges */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="hidden lg:flex items-center justify-center py-8"
          >
            {/* Placeholder for your image — replace div with <img> when ready */}
            <div className="relative w-full max-w-sm">
              {/* Image placeholder — Хаким поставит свою картинку сюда */}
              {/* <img src="/your-image.png" alt="Qadam" className="w-full" /> */}
              <HeroCampaignMock />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
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
                {idx < 3 && (
                  <div className="hidden md:block absolute top-3.5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-px bg-black/[0.08]" />
                )}
                <div className="mb-4">
                  <step.icon className={`h-7 w-7 ${step.highlight ? "text-amber-500" : "text-muted-foreground"}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Qadam */}
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
