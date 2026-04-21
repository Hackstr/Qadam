export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            Qadam collects minimal personal information. We collect:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Wallet address</strong> — automatically when you connect your Solana wallet</li>
            <li><strong>Email address</strong> — only if you voluntarily provide it for notifications</li>
            <li><strong>Display name</strong> — only if you voluntarily set one</li>
          </ul>
          <p className="mt-2">
            We do not collect passwords, private keys, seed phrases, or any financial information
            beyond what is publicly visible on the Solana blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Wallet address: to authenticate you and display your campaigns/positions</li>
            <li>Email: to send milestone updates, AI decisions, and governance notifications (if opted in)</li>
            <li>Display name: to show your profile to other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Blockchain Data</h2>
          <p>
            All campaign creations, backings, milestone submissions, and token claims are recorded on
            the Solana blockchain and are publicly visible. This data cannot be deleted or modified
            by Qadam or any other party.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Data Storage</h2>
          <p>
            Off-chain data (email, display name, campaign descriptions) is stored in a PostgreSQL
            database. We use industry-standard security measures to protect this data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Solana blockchain — for all on-chain transactions</li>
            <li>Solana blockchain — for all on-chain transactions and governance voting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Data Deletion</h2>
          <p>
            You may request deletion of your off-chain data (email, display name) at any time.
            On-chain data (transactions, token positions) cannot be deleted due to the immutable
            nature of blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
          <p>
            Qadam uses a JWT token stored in localStorage for authentication. We do not use tracking
            cookies or third-party analytics.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            For privacy-related questions, contact us through the platform or raise an issue on our
            GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
