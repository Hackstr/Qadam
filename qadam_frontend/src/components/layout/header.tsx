"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Menu, X } from "lucide-react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const NAV_LINKS = [
  { href: "/campaigns", label: "Discover", public: true },
  { href: "/dashboard", label: "My Campaigns", public: false },
  { href: "/portfolio", label: "My Backed", public: false },
  { href: "/analytics", label: "Analytics", public: true },
];

export function Header() {
  const { connected } = useWallet();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter((l) => l.public || connected);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      {/* Desktop nav */}
      <nav className="pointer-events-auto hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-full px-2 py-1.5">
        <Link href="/" className="flex items-center px-4 py-1.5 rounded-full hover:bg-black/[0.04] transition-colors">
          <span className="text-base font-bold tracking-tight">Qadam</span>
        </Link>

        <div className="w-px h-5 bg-black/[0.08]" />

        {visibleLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                isActive
                  ? "bg-black/[0.06] text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        <div className="w-px h-5 bg-black/[0.08]" />

        <div className="flex items-center gap-1">
          <WalletMultiButton
            style={{
              backgroundColor: "var(--foreground)",
              height: "32px",
              borderRadius: "9999px",
              fontSize: "13px",
              padding: "0 16px",
              lineHeight: "32px",
            }}
          />
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="pointer-events-auto md:hidden flex items-center justify-between w-full bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-2xl px-3 py-2">
        <Link href="/" className="text-base font-bold tracking-tight">Qadam</Link>
        <div className="flex items-center gap-2">
          <WalletMultiButton
            style={{
              backgroundColor: "var(--foreground)",
              height: "28px",
              borderRadius: "9999px",
              fontSize: "12px",
              padding: "0 12px",
              lineHeight: "28px",
            }}
          />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg hover:bg-black/[0.04]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="pointer-events-auto md:hidden absolute top-16 left-4 right-4 bg-white border border-black/[0.08] shadow-xl rounded-2xl p-3 flex flex-col gap-1">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-black/[0.06] text-foreground font-medium"
                    : "text-muted-foreground hover:bg-black/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
