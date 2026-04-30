import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Service — Qadam" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Qadam ("the Platform"), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Platform. Qadam is a decentralized crowdfunding platform
            built on the Solana blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Platform Description</h2>
          <p>
            Qadam provides milestone-based crowdfunding with community governance. Creators submit
            campaigns with defined milestones. Backers contribute SOL to an on-chain escrow smart contract.
            Funds are released to creators only after the community of backers votes to approve each
            milestone completion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Wallet and Authentication</h2>
          <p>
            You connect to the Platform using a Solana-compatible wallet. You are solely responsible for
            maintaining the security of your wallet, private keys, and seed phrases. Qadam never has access
            to your private keys.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Token Disclaimer</h2>
          <p>
            Qadam tokens are utility tokens that provide governance rights (voting on milestone extensions)
            and represent participation in a campaign. They are <strong>not</strong> investments, do not
            represent equity or ownership in any company, and carry no guarantee of financial return.
            Tokens do not constitute securities under any jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Risks</h2>
          <p>
            Using the Platform involves significant risks including but not limited to: loss of funds due to
            smart contract vulnerabilities, blockchain network failures, incorrect AI decisions, and creator
            non-delivery. The Platform is currently deployed on Solana Devnet for testing purposes.
            Never contribute more than you can afford to lose.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Milestone Verification</h2>
          <p>
            Milestone verification is performed by the community of backers through on-chain governance
            voting. Each backer&apos;s voting weight is their ownership points in that campaign, computed
            at the time of backing. Voting parameters — vote period, quorum, and approval threshold —
            are configured by the creator at campaign launch and locked from that point on.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Platform Fee</h2>
          <p>
            Qadam charges a 2.5% fee on funds released upon milestone approval. The fee is deducted from
            the released amount. No fees are charged if no funds are released.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
          <p>
            The Platform is provided "as is" without warranties of any kind. Qadam shall not be liable for
            any direct, indirect, incidental, or consequential damages arising from your use of the Platform,
            including loss of funds, tokens, or data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page.
            Continued use of the Platform constitutes acceptance of modified Terms.
          </p>
        </section>
      </div>
    </div>
  );
}
