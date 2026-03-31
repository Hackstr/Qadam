"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// Wallet button must be client-only (no SSR)
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export function Header() {
  const { connected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-full px-2 py-1.5">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center px-4 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors"
        >
          <span className="text-base font-bold tracking-tight">Qadam</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-black/[0.08]" />

        {/* Nav links */}
        <Link
          href="/campaigns"
          className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors"
        >
          Discover
        </Link>

        {connected && (
          <>
            <Link
              href="/create"
              className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors"
            >
              Create
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/portfolio"
              className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors"
            >
              Portfolio
            </Link>
          </>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-black/[0.08]" />

        {/* Wallet */}
        <div className="flex items-center">
          <WalletMultiButton
            style={{
              backgroundColor: "#0F1724",
              height: "32px",
              borderRadius: "9999px",
              fontSize: "13px",
              padding: "0 16px",
              lineHeight: "32px",
            }}
          />
        </div>
      </nav>
    </header>
  );
}
