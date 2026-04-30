import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MilestoneDots } from "@/components/qadam/milestone-dots";
import { TierBadge } from "@/components/qadam/tier-badge";
import { ArrowRight, Wallet, Shield, Coins, RotateCcw } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Hero */}
      <div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">About Qadam</h1>
        <p className="text-lg text-muted-foreground">Build step by step.</p>
      </div>

      {/* Intro */}
      <p className="text-lg leading-relaxed max-w-3xl">
        Qadam — meaning &ldquo;step&rdquo; in Turkic — is community-governed crowdfunding on Solana.
        Backers&apos; SOL stays in escrow until the community of backers votes to approve each milestone.
        Creators get paid for real progress. Backers earn ownership in every project they support.
      </p>

      {/* Why we built this */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">Why we built this</h2>
        <div className="space-y-3 text-base leading-relaxed text-muted-foreground max-w-3xl">
          <p>
            Traditional crowdfunding has a trust problem. Creators get paid upfront. Backers have
            no recourse if the project fails. Over $1.7B has been lost on platforms like Kickstarter
            from projects that raised money and never delivered.
          </p>
          <p>
            We built Qadam to fix this. Funds stay locked on-chain. The community of backers —
            not a platform, not an AI — decides whether each milestone has been delivered. Approve
            releases the next tranche. Reject sends it back. Refund returns what&apos;s left.
          </p>
        </div>
      </section>

      {/* How it works — 4 stages */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-6">How it works in four stages</h2>
        <MilestoneDots total={4} approved={2} variant="connected" size="md" className="mb-6 max-w-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Wallet, title: "Lock", desc: "Backers commit SOL. It enters the campaign vault on-chain." },
            { icon: Shield, title: "Hold", desc: "Funds wait in escrow. Only the smart contract can move SOL." },
            { icon: Coins, title: "Release", desc: "Community approves a milestone. 97.5% to creator, 2.5% fee." },
            { icon: RotateCcw, title: "Refund", desc: "If milestones fail, remaining SOL returns to all backers." },
          ].map((s) => (
            <div key={s.title} className="border border-black/[0.06] rounded-2xl p-5">
              <s.icon className="h-5 w-5 text-amber-500 mb-3" />
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Backers earn ownership */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">Backers earn ownership</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl mb-6">
          When you back a project, you earn ownership points: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">points = sol_contributed × tier_multiplier</code>.
          The earlier you back, the higher your multiplier. The creator chooses the tier structure
          when they launch. Points give you voting power during the campaign and a share of project
          tokens when it completes.
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
        <p className="text-xs text-muted-foreground">Each campaign sets its own tiers, multipliers, and spot counts.</p>
      </section>

      {/* Built by */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">Built by</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
          Qadam is built by Khakim from Almaty, Kazakhstan. Supported by Superteam KZ
          and the broader Solana ecosystem. The project is participating in the Colosseum
          Frontier Hackathon 2026.
        </p>
      </section>

      {/* Open source */}
      <section>
        <h2 className="font-display text-2xl tracking-tight mb-4">Open source</h2>
        <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
          Qadam is fully open source. The smart contract, backend, and frontend are all
          publicly available on GitHub. Every transaction is verifiable on Solana Explorer.
        </p>
        <a
          href="https://github.com/Hackstr/Qadam"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:underline inline-block mt-2 text-sm"
        >
          View on GitHub
        </a>
      </section>

      {/* CTA */}
      <div className="pt-4 flex gap-4">
        <Link href="/create">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">
            Start a Campaign <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/how-it-works">
          <Button variant="outline" className="gap-2 rounded-full">
            How it works in detail
          </Button>
        </Link>
      </div>
    </div>
  );
}
