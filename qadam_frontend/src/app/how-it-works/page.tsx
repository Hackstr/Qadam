import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, PenLine, Wallet, Users, Send,
  Shield, Vote, Coins, RotateCcw,
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: PenLine,
    title: "Creator defines the project",
    desc: "Title, description, cover image, pitch video. Then breaks the project into 1-5 milestones — each with clear acceptance criteria, a SOL amount, and a deadline.",
  },
  {
    num: "02",
    icon: Shield,
    title: "SOL goes to escrow",
    desc: "When backers fund the campaign, their SOL goes directly into a Solana smart contract (PDA vault). Not to the creator's wallet. The creator physically cannot access these funds until milestones are approved.",
  },
  {
    num: "03",
    icon: Send,
    title: "Creator submits evidence",
    desc: "When a milestone is complete, the creator submits evidence: description of what was built, demo links, screenshots. The evidence hash is recorded on-chain for transparency.",
  },
  {
    num: "04",
    icon: Vote,
    title: "Community votes",
    desc: "Every backer votes on-chain: approve or reject. Voting weight is proportional to contribution, with a 20% cap per position to prevent whale dominance. A 20% quorum is required.",
  },
  {
    num: "05",
    icon: Coins,
    title: "SOL releases automatically",
    desc: "If the community approves — the smart contract automatically transfers SOL to the creator. No intermediary. No delay. The 2.5% platform fee is deducted from the release, not added on top.",
  },
  {
    num: "06",
    icon: RotateCcw,
    title: "If rejected — backer protection",
    desc: "If the community rejects a milestone, the creator can request a deadline extension. Backers vote again: extend or refund. If refund wins — SOL returns proportionally to all backers.",
  },
];

const TIERS = [
  { name: "Founders", ratio: "1.0 pts/SOL", backers: "First 50 backers", color: "bg-green-50 text-green-700 border-green-200" },
  { name: "Early Backers", ratio: "0.67 pts/SOL", backers: "Backers 51-250", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Supporters", ratio: "0.5 pts/SOL", backers: "Everyone after 250", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight mb-2">How Qadam Works</h1>
      <p className="text-muted-foreground mb-12">The complete flow from idea to funded project.</p>

      {/* Steps */}
      <div className="space-y-6 mb-16">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                {step.num !== "06" && <div className="w-px flex-1 bg-amber-100 mt-2" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-500">{step.num}</span>
                  <h3 className="font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backer Tiers */}
      <div className="mb-16">
        <h2 className="font-display text-2xl tracking-tight mb-4">Backer Tiers</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Early backers earn a higher share of the project. The earlier you back, the more project tokens you receive per SOL.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <Card key={tier.name} className={`border ${tier.color}`}>
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-bold">{tier.ratio}</p>
                <p className="font-semibold mt-1">{tier.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{tier.backers}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key numbers */}
      <div className="mb-16">
        <h2 className="font-display text-2xl tracking-tight mb-4">Key Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "2.5%", label: "Platform fee", desc: "Per milestone release" },
            { value: "0.5%", label: "Security deposit", desc: "Returned progressively" },
            { value: "20%", label: "Quorum", desc: "Required for votes" },
            { value: "20%", label: "Vote cap", desc: "Max per backer position" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-amber-500">{item.value}</p>
                <p className="text-xs font-medium mt-1">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="font-display text-2xl tracking-tight mb-2">Ready?</h2>
        <p className="text-muted-foreground mb-6">Whether you are building or backing — Qadam protects both sides.</p>
        <div className="flex gap-4 justify-center">
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
    </div>
  );
}
