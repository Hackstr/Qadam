import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Solana
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Program
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "";

// Qadam constants (must match Anchor program constants.rs)
export const QADAM_FEE_BPS = 250; // 2.5%
export const SECURITY_DEPOSIT_BPS = 50; // 0.5%
export const MAX_MILESTONES = 5;
export const MIN_BACKING_SOL = 0.1;
export const MIN_BACKING_LAMPORTS = MIN_BACKING_SOL * LAMPORTS_PER_SOL;

// Tiers
export const TIER_1_MAX_BACKERS = 50;
export const TIER_2_MAX_BACKERS = 250;
export const TIER_LABELS = {
  1: { name: "Founders", color: "text-green-600", ratio: "1.0x", points: "1.0 pts/SOL" },
  2: { name: "Early Backers", color: "text-amber-600", ratio: "0.67x", points: "0.67 pts/SOL" },
  3: { name: "Supporters", color: "text-gray-500", ratio: "0.5x", points: "0.5 pts/SOL" },
} as const;

// Design
export const BRAND_COLORS = {
  primary: "#0F1724",
  accent: "#F5A623",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  surface: "#FAFAF8",
  muted: "#6B7280",
} as const;

// Formatting helpers
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number, decimals = 2): string {
  return `${lamportsToSol(lamports).toFixed(decimals)} SOL`;
}

export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
