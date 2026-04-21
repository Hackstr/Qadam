import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Qadam &mdash; Build step by step</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">Powered by Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
