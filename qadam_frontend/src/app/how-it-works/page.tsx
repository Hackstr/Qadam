import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MilestoneDots } from "@/components/qadam/milestone-dots";
import { EscrowIndicator } from "@/components/qadam/escrow-indicator";
import { TierBadge } from "@/components/qadam/tier-badge";
import {
  ArrowRight, Wallet, Shield, Coins, RotateCcw,
  Lock, Vote, Timer, Users,
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Hero */}
      <div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">How Qadam works</h1>
        <p className="text-lg text-muted-foreground">From idea to funded project — every stage explained.</p>
      </div>

      {/* ═══ 1. THE 4-STAGE MONEY FLOW ═══ */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-6">The four stages of funding</h2>
        <MilestoneDots total={4} approved={2} variant="connected" size="md" className="mb-8 max-w-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Wallet, title: "Lock", desc: "Backers commit SOL. It leaves their wallet, enters the campaign vault on-chain.", highlight: false },
            { icon: Shield, title: "Hold", desc: "Funds wait in escrow. Creator can't touch them. Qadam can't touch them. Only the smart contract — guided by community votes — can move SOL.", highlight: false },
            { icon: Coins, title: "Release", desc: "Community votes to approve a milestone. The smart contract releases that milestone's amount: 97.5% to creator, 2.5% to Qadam.", highlight: true },
            { icon: RotateCcw, title: "Refund", desc: "If a milestone fails and backers vote to refund, remaining vault balance returns to all backers, proportional to their original contribution.", highlight: false },
          ].map((s) => (
            <div key={s.title} className={`rounded-2xl p-6 border ${s.highlight ? "bg-amber-500 text-white border-amber-500" : "bg-white border-black/[0.06]"}`}>
              <s.icon className={`h-6 w-6 mb-3 ${s.highlight ? "text-white" : "text-amber-500"}`} />
              <h3 className={`font-semibold mb-1 ${s.highlight ? "text-white" : ""}`}>{s.title}</h3>
              <p className={`text-sm leading-relaxed ${s.highlight ? "text-white/80" : "text-muted-foreground"}`}>{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">Funds move only through the on-chain program. No human can withdraw a vault directly.</p>
      </section>

      {/* ═══ 2. ESCROW VISUALIZATION ═══ */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">Where your SOL lives</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl mb-6">
          Each campaign has its own Program Derived Address (PDA) on Solana. Funds aren&apos;t pooled
          across campaigns. The Qadam team has no key to any vault. The smart contract — and the
          community vote that triggers it — is the only path SOL can take.
        </p>
        <div className="max-w-md">
          <EscrowIndicator
            variant="full"
            amountLamports={12_500_000_000}
            solanaAddress="7t92Yx5LPVHPUkyo26tvFu8FXoT3E5FX3H3qiiDzzgis"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">Every escrow vault is publicly verifiable on Solana Explorer.</p>
      </section>

      {/* ═══ 3. VOTING ═══ */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">How the community decides</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl mb-6">
          Backers — and only backers of that specific campaign — vote on each milestone.
          Vote weight equals your ownership points. The creator picks the rules at launch:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { icon: Timer, label: "Vote period", range: "3 — 14 days", desc: "How long voting stays open after evidence is submitted." },
            { icon: Users, label: "Quorum", range: "10% — 50%", desc: "Minimum participating weight for a vote to be valid." },
            { icon: Vote, label: "Approval threshold", range: "50% — 75%", desc: "Percentage of YES votes needed to pass. 50% = simple majority." },
          ].map((v) => (
            <div key={v.label} className="border border-black/[0.06] rounded-2xl p-5 bg-white">
              <v.icon className="h-5 w-5 text-purple-500 mb-2" />
              <p className="text-sm font-semibold mb-0.5">{v.label}</p>
              <p className="text-xl font-bold text-amber-500 tabular-nums mb-1">{v.range}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Once a campaign launches, voting rules lock. Creator can&apos;t change them mid-campaign.</p>
      </section>

      {/* ═══ 4. OWNERSHIP ═══ */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">What backers earn</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl mb-6">
          Backers don&apos;t get equity. They earn ownership points — utility, not securities.
          Computed as <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">sol_contributed × tier_multiplier</code>.
          The earlier you back, the higher your tier&apos;s multiplier. The creator chooses the tier structure:
          from 1 tier (everyone equal) up to 10 tiers.
        </p>

        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Example structure — not a platform default</p>
        <div className="flex gap-3 mb-2">
          <div className="border border-green-100 bg-green-50 rounded-xl px-4 py-2.5 text-center">
            <TierBadge tier={1} variant="text" className="text-sm font-semibold" />
            <p className="text-xs text-green-600 mt-0.5">100%</p>
          </div>
          <div className="border border-amber-100 bg-amber-50 rounded-xl px-4 py-2.5 text-center">
            <TierBadge tier={2} variant="text" className="text-sm font-semibold" />
            <p className="text-xs text-amber-600 mt-0.5">70%</p>
          </div>
          <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-center">
            <TierBadge tier={3} variant="text" className="text-sm font-semibold" />
            <p className="text-xs text-gray-500 mt-0.5">50%</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Each campaign sets its own tiers, multipliers, and spot counts.</p>

        {/* Worked example */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 max-w-2xl">
          <p className="text-sm leading-relaxed text-amber-900">
            <strong>Worked example:</strong> If a creator launches with the example tiers above and
            you back 2 SOL as a Founder, you earn 2.0 ownership points. If you back later as an
            Early Backer with 5 SOL, you earn 3.5 points. Your share at completion is your points ÷ total pool.
          </p>
        </div>
      </section>

      {/* ═══ 5. SYSTEM INVARIANTS ═══ */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-6">What Qadam guarantees</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "2.5%", label: "Platform fee", sub: "Taken on release, never on backing" },
            { value: "On-chain", label: "Escrow", sub: "No human can drain a vault" },
            { value: "Creator-set", label: "Tier structure", sub: "1 to 10 tiers, monotonic decrease" },
            { value: "Creator-set", label: "Voting rules", sub: "Period, quorum, threshold" },
          ].map((s) => (
            <div key={s.label} className="border border-black/[0.06] rounded-2xl p-5 text-center">
              <p className="text-2xl font-bold text-amber-500 tabular-nums">{s.value}</p>
              <p className="text-xs font-medium mt-1">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">These rules are enforced by the on-chain program. They cannot be changed by Qadam mid-campaign.</p>
      </section>

      {/* CTA */}
      <div className="flex gap-4">
        <Link href="/create">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
            Start a Campaign <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/campaigns">
          <Button variant="outline" className="gap-2 rounded-full">
            Explore Campaigns
          </Button>
        </Link>
      </div>
    </div>
  );
}
