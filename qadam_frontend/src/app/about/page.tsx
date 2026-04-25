import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight mb-2">About Qadam</h1>
      <p className="text-muted-foreground mb-8">Build step by step.</p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">What is Qadam?</h2>
          <p>
            Qadam (meaning "step" in Kazakh) is community-governed crowdfunding on Solana.
            When you back a project, your SOL goes into an on-chain smart contract — not to
            the creator. Funds release milestone by milestone, only when the community of
            backers votes to approve each step.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Why we built this</h2>
          <p>
            Traditional crowdfunding has a trust problem. Creators get paid upfront. Backers
            have no recourse if the project fails. Over $1.7B has been lost on platforms like
            Kickstarter from projects that raised money and never delivered.
          </p>
          <p className="mt-2">
            We built Qadam to fix this. With milestone-based escrow and community governance,
            creators are incentivized to deliver real progress — and backers have real control
            over their investment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How it works</h2>
          <p>
            Creators define milestones with clear acceptance criteria. Backers send SOL to the
            smart contract. When a creator completes a milestone, they submit evidence. The
            community of backers votes on-chain — approved means SOL releases, rejected means
            the creator gets another chance or backers get refunded. The smart contract enforces
            everything automatically.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">The team</h2>
          <p>
            Qadam is built by Khakim from Almaty, Kazakhstan. Supported by the Superteam KZ
            community and the broader Solana ecosystem. The project is participating in the
            Colosseum Frontier Hackathon 2026.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Open source</h2>
          <p>
            Qadam is fully open source. The smart contract, backend, and frontend are all
            publicly available on GitHub. Every transaction is verifiable on Solana Explorer.
          </p>
          <a
            href="https://github.com/Hackstr/Qadam"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline inline-block mt-1"
          >
            View on GitHub
          </a>
        </section>

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
    </div>
  );
}
