"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsRead } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Bell as BellIcon } from "lucide-react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const NAV_LINKS = [
  { href: "/campaigns", label: "Discover", public: true },
  { href: "/create", label: "Create", public: false },
  { href: "/dashboard", label: "My Campaigns", public: false },
  { href: "/portfolio", label: "My Backed", public: false },
  { href: "/analytics", label: "Analytics", public: false },
];

export function Header() {
  const { connected } = useWallet();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: connected && isAuthenticated(),
    refetchInterval: 30000,
    retry: false,
  });
  const unreadCount = notifData?.unread_count || 0;

  const visibleLinks = NAV_LINKS.filter((l) => l.public || connected);

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

        <div className="w-px h-5 bg-black/[0.08]" />

        {/* Nav links */}
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

        {/* Notification bell + Wallet */}
        <div className="flex items-center gap-1">
          {connected && (
            <button
              className="relative p-2 rounded-full hover:bg-black/[0.04] transition-colors"
              title="Notifications"
              onClick={async () => {
                if (unreadCount > 0) {
                  await markNotificationsRead();
                  queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }
              }}
            >
              <BellIcon className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          )}
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
