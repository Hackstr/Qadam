"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "How does escrow work?",
    a: "When you back a project, your SOL goes directly into a smart contract on Solana — not to the creator. The contract holds it until the community of backers votes to approve each milestone. Only then are funds released.",
  },
  {
    q: "What if the community rejects a milestone unfairly?",
    a: "Creators can request a deadline extension. The community votes again — extend or refund. Acceptance criteria set upfront protect both sides. If criteria are clearly met, the community is incentivized to approve (their tokens depend on project success too).",
  },
  {
    q: "How do I receive my share?",
    a: "After each milestone is approved, you can claim your share in My Backed \u2192 \"Claim Share\". Shares are released proportionally per approved milestone. For example, if a campaign has 3 milestones, you can claim 1/3 of your share after each approval.",
  },
  {
    q: "Can I get my SOL back if the project fails?",
    a: "Yes. If a milestone fails and backers vote for refund (instead of a deadline extension), remaining SOL is returned proportionally to all backers based on their contribution.",
  },
  {
    q: "What are Founders / Early Backers / Supporters tiers?",
    a: "The first 50 backers are Founders (1.0 ownership points per SOL). Next 200 are Early Backers (0.67 points). Everyone after is Supporters (0.5 points). Back early for more ownership.",
  },
  {
    q: "How does milestone verification work?",
    a: "Creators write what they accomplished, add demo links or screenshots, and submit evidence. The community of backers then votes on whether the acceptance criteria are met. Approved — SOL released. Not approved — backers vote for an extension or refund.",
  },
  {
    q: "What's the platform fee?",
    a: "2.5%, deducted automatically from each milestone release. If the creator earns zero, Qadam earns zero. The fee is taken from the released amount, not from the vault.",
  },
  {
    q: "What happens if a creator misses a deadline?",
    a: "There's a 7-day grace period after each deadline. If the creator still hasn't submitted, backers can vote to either extend the deadline or trigger a refund. A 20% quorum is required for the vote to pass.",
  },
  {
    q: "Is this safe? Has it been audited?",
    a: "The smart contract is deployed on Solana Devnet for testing. A formal security audit is in preparation. All code is open source. Never invest more than you can afford to lose during the devnet phase.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-black/[0.06] rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-medium pr-4">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">
        Everything you need to know about backing and creating campaigns on Qadam.
      </p>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}
