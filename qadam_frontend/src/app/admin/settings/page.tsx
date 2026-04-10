"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, ExternalLink, Info, Lock } from "lucide-react";
import { SOLANA_NETWORK } from "@/lib/constants";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "Not set";
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || "Not set";

function ReadOnlyField({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-black/[0.04] last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="group relative">
          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#0F1724] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {hint}
          </span>
        </span>
      </div>
      <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

function WalletField({ label, address, hint }: { label: string; address: string; hint: string }) {
  const explorerUrl = `https://explorer.solana.com/address/${address}${SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""}`;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-black/[0.04] last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="group relative">
          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#0F1724] text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {hint}
          </span>
        </span>
      </div>
      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground hover:text-amber-600 flex items-center gap-1">
        {address.slice(0, 6)}...{address.slice(-4)}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Read-only. Protocol parameters are hardcoded in the Anchor smart contract.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Constants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Protocol Parameters
              <Badge variant="outline" className="text-[10px]">On-chain</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyField label="Platform Fee" value="2.5%" hint="Hardcoded in constants.rs (QADAM_FEE_BPS = 250)" />
            <ReadOnlyField label="Security Deposit" value="0.5%" hint="Hardcoded in constants.rs (SECURITY_DEPOSIT_BPS = 50)" />
            <ReadOnlyField label="Min Backing" value="0.1 SOL" hint="Hardcoded in constants.rs (MIN_BACKING_LAMPORTS)" />
            <ReadOnlyField label="Max Milestones" value={5} hint="Hardcoded in constants.rs (MAX_MILESTONES = 5)" />
            <ReadOnlyField label="Grace Period" value="7 days" hint="Hardcoded in constants.rs (GRACE_PERIOD_SECONDS)" />
            <ReadOnlyField label="Voting Period" value="7 days" hint="Hardcoded in constants.rs (VOTING_PERIOD_SECONDS)" />
            <ReadOnlyField label="Max Extension" value="30 days" hint="Hardcoded in constants.rs (MAX_EXTENSION_SECONDS)" />
            <ReadOnlyField label="Quorum" value="20%" hint="Hardcoded in constants.rs (QUORUM_BPS = 2000)" />
            <ReadOnlyField label="Vote Cap" value="20% per position" hint="Hardcoded in constants.rs (VOTE_CAP_BPS = 2000)" />
          </CardContent>
        </Card>

        {/* Tier System */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Tier System
              <Badge variant="outline" className="text-[10px]">On-chain</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyField label="Genesis (Tier 1)" value="First 50 backers \u2014 1.0x" hint="TIER_1_MAX_BACKERS = 50, full token rate" />
            <ReadOnlyField label="Early (Tier 2)" value="Backers 51-250 \u2014 0.67x" hint="TIER_2_MAX_BACKERS = 250, TIER_2_RATIO_BPS = 6700" />
            <ReadOnlyField label="Standard (Tier 3)" value="251+ \u2014 0.5x" hint="TIER_3_RATIO_BPS = 5000" />
          </CardContent>
        </Card>

        {/* Wallets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Wallets
              <Badge variant="outline" className="text-[10px]">Config</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletField label="Admin Wallet" address={ADMIN_WALLET} hint="Set via NEXT_PUBLIC_ADMIN_WALLET env var" />
            <WalletField label="Program ID" address={PROGRAM_ID} hint="Anchor program deployed on devnet" />
          </CardContent>
        </Card>

        {/* Network */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Network
              <Badge className={SOLANA_NETWORK === "devnet" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"} >
                {SOLANA_NETWORK}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReadOnlyField label="RPC URL" value={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "Default"} hint="Set via NEXT_PUBLIC_SOLANA_RPC_URL env var" />
            <ReadOnlyField label="Network" value={SOLANA_NETWORK} hint="Set via NEXT_PUBLIC_SOLANA_NETWORK env var" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
