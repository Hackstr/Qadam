"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Landing page has its own rich footer — skip global one
  if (pathname === "/") return null;

  return (
    <footer className="border-t bg-secondary/50 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Qadam &mdash; Build step by step</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>&middot;</span>
            <span>Powered by Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
