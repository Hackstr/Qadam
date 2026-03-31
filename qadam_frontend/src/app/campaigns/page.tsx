"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import type { Campaign } from "@/types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const CATEGORIES = ["All", "Apps", "Games", "SaaS", "Tools", "Infrastructure"];
const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "All", value: undefined },
];

// Demo data for preview
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1", solana_pubkey: "demo1", creator_wallet: "Cr1...xyz",
    title: "Nomad — Digital Nomad Finance App",
    description: "All-in-one banking for remote workers. Multi-currency accounts, crypto off-ramps, tax tools for 40+ countries.",
    category: "Apps", status: "active",
    goal_lamports: 50 * LAMPORTS_PER_SOL, raised_lamports: 37.5 * LAMPORTS_PER_SOL,
    backers_count: 42, milestones_count: 4, milestones_approved: 1,
    token_mint_address: "mint1", inserted_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "2", solana_pubkey: "demo2", creator_wallet: "Cr2...abc",
    title: "ChainQuest — On-chain RPG",
    description: "Fully on-chain RPG where every item, quest, and battle is a Solana transaction. Play-to-own, not play-to-earn.",
    category: "Games", status: "active",
    goal_lamports: 100 * LAMPORTS_PER_SOL, raised_lamports: 23 * LAMPORTS_PER_SOL,
    backers_count: 156, milestones_count: 5, milestones_approved: 0,
    token_mint_address: "mint2", inserted_at: "2026-03-20T00:00:00Z",
  },
  {
    id: "3", solana_pubkey: "demo3", creator_wallet: "Cr3...def",
    title: "InvoiceFlow — AI Accounting for Freelancers",
    description: "Snap a photo of any receipt or invoice. AI categorizes, tracks expenses, generates tax reports. Supports KZ, RU, EU.",
    category: "SaaS", status: "active",
    goal_lamports: 20 * LAMPORTS_PER_SOL, raised_lamports: 18.5 * LAMPORTS_PER_SOL,
    backers_count: 28, milestones_count: 3, milestones_approved: 2,
    token_mint_address: "mint3", inserted_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "4", solana_pubkey: "demo4", creator_wallet: "Cr4...ghi",
    title: "SolanaGuard — Smart Contract Audit Tool",
    description: "Automated security scanner for Anchor programs. Finds common vulnerabilities before hackers do.",
    category: "Tools", status: "completed",
    goal_lamports: 30 * LAMPORTS_PER_SOL, raised_lamports: 30 * LAMPORTS_PER_SOL,
    backers_count: 67, milestones_count: 3, milestones_approved: 3,
    token_mint_address: "mint4", inserted_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "5", solana_pubkey: "demo5", creator_wallet: "Cr5...jkl",
    title: "Mesh — Decentralized CDN on Solana",
    description: "Share your spare bandwidth, earn SOL. Web3 alternative to Cloudflare with edge nodes in 50+ countries.",
    category: "Infrastructure", status: "active",
    goal_lamports: 200 * LAMPORTS_PER_SOL, raised_lamports: 45 * LAMPORTS_PER_SOL,
    backers_count: 89, milestones_count: 5, milestones_approved: 0,
    token_mint_address: "mint5", inserted_at: "2026-03-25T00:00:00Z",
  },
  {
    id: "6", solana_pubkey: "demo6", creator_wallet: "Cr6...mno",
    title: "LangBridge — Real-time Translation Earbuds",
    description: "Hardware + software: wireless earbuds with on-device AI translation. 30 languages, <500ms latency.",
    category: "Apps", status: "active",
    goal_lamports: 150 * LAMPORTS_PER_SOL, raised_lamports: 112 * LAMPORTS_PER_SOL,
    backers_count: 234, milestones_count: 4, milestones_approved: 1,
    token_mint_address: "mint6", inserted_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "7", solana_pubkey: "demo7", creator_wallet: "Cr7...pqr",
    title: "FarmDAO — Tokenized Agriculture in Kazakhstan",
    description: "Invest in real farms through tokens. Track crop growth via IoT sensors. Harvest = dividends.",
    category: "SaaS", status: "active",
    goal_lamports: 80 * LAMPORTS_PER_SOL, raised_lamports: 80 * LAMPORTS_PER_SOL,
    backers_count: 51, milestones_count: 3, milestones_approved: 1,
    token_mint_address: "mint7", inserted_at: "2026-03-18T00:00:00Z",
  },
  {
    id: "8", solana_pubkey: "demo8", creator_wallet: "Cr8...stu",
    title: "PixelForge — AI Game Asset Generator",
    description: "Generate 2D/3D game assets from text prompts. Spritesheets, tilesets, character animations. Free for indie devs.",
    category: "Games", status: "completed",
    goal_lamports: 15 * LAMPORTS_PER_SOL, raised_lamports: 15 * LAMPORTS_PER_SOL,
    backers_count: 35, milestones_count: 2, milestones_approved: 2,
    token_mint_address: "mint8", inserted_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "9", solana_pubkey: "demo9", creator_wallet: "Cr9...vwx",
    title: "SolMail — Encrypted Email on Solana",
    description: "End-to-end encrypted email where your wallet IS your address. No servers, no censorship, no spam.",
    category: "Tools", status: "active",
    goal_lamports: 40 * LAMPORTS_PER_SOL, raised_lamports: 8 * LAMPORTS_PER_SOL,
    backers_count: 12, milestones_count: 3, milestones_approved: 0,
    token_mint_address: "mint9", inserted_at: "2026-03-28T00:00:00Z",
  },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<string | undefined>("active");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", status, category],
    queryFn: () => getCampaigns({ status, category, limit: 50 }),
    retry: false,
  });

  // Use API data if available, otherwise show mock data
  const apiCampaigns = data?.data || [];
  const allCampaigns = apiCampaigns.length > 0 ? apiCampaigns : MOCK_CAMPAIGNS;

  const campaigns = useMemo(() => {
    return allCampaigns.filter((c) => {
      if (status && c.status !== status) return false;
      if (category && c.category !== category) return false;
      return true;
    });
  }, [allCampaigns, status, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Back projects you believe in. SOL stays in escrow until milestones are verified by AI.
        </p>
      </div>

      {/* Filters — pill style matching navbar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 bg-black/[0.02] rounded-full p-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s.label}
            onClick={() => setStatus(s.value)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              status === s.value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="w-px h-4 bg-black/[0.08] mx-1" />
        {CATEGORIES.map((cat) => {
          const catValue = cat === "All" ? undefined : cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(catValue)}
              className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                category === catValue
                  ? "bg-white text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No campaigns found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a different filter or create one yourself.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
