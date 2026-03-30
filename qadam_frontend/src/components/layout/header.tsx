"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Qadam</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Build step by step
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/campaigns"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Discover
          </Link>
          {connected && (
            <>
              <Link
                href="/create"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Create
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Portfolio
              </Link>
            </>
          )}
        </nav>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          <WalletMultiButton
            style={{
              backgroundColor: "#0F1724",
              height: "38px",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>
      </div>
    </header>
  );
}
