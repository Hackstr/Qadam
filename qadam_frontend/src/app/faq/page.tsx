"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const CATEGORIES = [
  {
    title: "Money & escrow",
    questions: [
      { q: "How does escrow work?", a: "When you back a project, your SOL goes directly into a smart contract on Solana — not to the creator. The contract holds it until the community of backers votes to approve each milestone. Only then does the contract release that milestone's portion to the creator." },
      { q: "Can I get my SOL back if the project fails?", a: "Yes. If a milestone fails and backers vote for refund instead of granting an extension, remaining SOL is returned proportionally to all backers based on their original contribution. The platform fee from milestones already released is not refunded." },
      { q: "What's the platform fee?", a: "2.5%, taken when a milestone is released to the creator — never on backing, never on refund. So if you back 1 SOL, the full 1 SOL enters escrow. When a 1 SOL milestone is approved, 0.975 SOL goes to the creator and 0.025 SOL goes to Qadam." },
    ],
  },
  {
    title: "Voting & community governance",
    questions: [
      { q: "Who decides whether a milestone is approved?", a: "Only the backers of that specific campaign. Random platform users have no say. Voting weight is proportional to your ownership points — which you earned when you backed." },
      { q: "What if the community rejects a milestone unfairly?", a: "The creator can request a deadline extension. The community votes again — extend or refund. Acceptance criteria set up front by the creator are visible to everyone, so what counts as 'done' isn't ambiguous." },
      { q: "Are voting rules fixed for everyone?", a: "No. Each creator picks their own voting rules when launching: vote period (3–14 days), quorum (10–50% of total weight required to participate), and approval threshold (50–75% YES required to pass). Once a campaign launches, those rules lock — they can't change mid-campaign." },
    ],
  },
  {
    title: "Backer rewards",
    questions: [
      { q: "What are ownership points?", a: "A number that represents your share of the campaign. Computed as sol_contributed × tier_multiplier. They give you voting weight during the campaign and a claim on project tokens when it completes. They are not equity, not a security, no promise of profit." },
      { q: "What are tiers like Founders / Early Backers / Supporters?", a: "Tiers are how creators reward early support. The first tier always earns the full multiplier (100%), and each later tier earns less. Each campaign defines its own tier structure — how many tiers (1 to 10), how many spots in each, what the multipliers are. Qadam only enforces the rules: tier 1 must be 100%, multipliers must decrease, last tier is always unlimited spots." },
      { q: "How do I receive my share of project tokens?", a: "After the campaign completes (all milestones approved), you can claim your share in My Backed → Claim. Your share = your_points / total_points of the project's token supply." },
    ],
  },
  {
    title: "Deadlines & failure",
    questions: [
      { q: "What happens if a creator misses a deadline?", a: "There's a grace period after each deadline. If the creator still hasn't submitted, backers can vote to either grant an extension or trigger a refund." },
      { q: "How does milestone verification work?", a: "The creator writes what they accomplished, links demos or screenshots, and submits evidence — referencing the acceptance criteria they set up when launching. The community votes: do these demonstrate the criteria are met? Approved → SOL releases. Rejected → creator can request an extension or backers can vote refund." },
      { q: "Is this safe? Has it been audited?", a: "The smart contract is currently deployed on Solana Devnet for testing. A formal security audit is in preparation. All code is open source. Never contribute more than you can afford to lose during the devnet phase." },
    ],
  },
];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3">FAQ</h1>
      <p className="text-lg text-muted-foreground mb-12">Common questions about Qadam, answered honestly.</p>

      {CATEGORIES.map((cat, ci) => (
        <div key={cat.title} className={ci > 0 ? "mt-12" : ""}>
          <h2 className="font-display text-2xl tracking-tight mb-3">{cat.title}</h2>
          <div className="h-px bg-amber-200/60 mb-4" />
          <div className="space-y-0">
            {cat.questions.map((faq, qi) => {
              const key = `${ci}-${qi}`;
              const isOpen = openIdx === key;
              return (
                <div key={key} className="border-b border-black/[0.04]">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : key)}
                    className="flex items-center justify-between w-full py-4 text-left"
                  >
                    <span className={`text-sm ${isOpen ? "font-semibold" : "font-medium"}`}>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
                  </button>
                  {isOpen && (
                    <p className="text-sm text-muted-foreground leading-relaxed pb-4 pr-8">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
