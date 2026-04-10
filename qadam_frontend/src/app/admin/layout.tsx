"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ClipboardCheck, FolderOpen, Milestone,
  Users, Vote, Brain, ScrollText, Settings, ShieldAlert,
  Menu, X,
} from "lucide-react";
import { useState } from "react";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/reviews", label: "Review Queue", icon: ClipboardCheck },
  { href: "/admin/campaigns", label: "Campaigns", icon: FolderOpen },
  { href: "/admin/milestones", label: "Milestones", icon: Milestone },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/governance", label: "Governance", icon: Vote },
  { href: "/admin/ai", label: "AI Analytics", icon: Brain },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground">Connect your admin wallet to continue.</p>
        </div>
      </div>
    );
  }

  if (publicKey?.toBase58() !== ADMIN_WALLET) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
          <p className="text-muted-foreground">This wallet does not have admin access.</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">{publicKey?.toBase58()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-[#0F1724] text-white p-3 rounded-full shadow-lg"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        fixed md:sticky top-0 md:top-auto left-0
        w-56 h-screen md:h-auto
        bg-white border-r border-black/[0.06]
        transition-transform z-40
        flex flex-col
        pt-20 md:pt-4 pb-4
      `}>
        <div className="px-4 pb-3 mb-2 border-b border-black/[0.06]">
          <p className="text-sm font-bold tracking-tight">Qadam Admin</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </p>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/admin";
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                  ${isActive
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pt-3 border-t border-black/[0.06]">
          <p className="text-[10px] text-muted-foreground">Qadam Admin v1</p>
          <p className="text-[10px] text-muted-foreground">devnet</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content */}
      <main className="flex-1 min-w-0 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
