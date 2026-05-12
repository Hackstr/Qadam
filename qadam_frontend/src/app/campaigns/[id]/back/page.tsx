"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getCampaign } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MIN_BACKING_SOL,
  TIER_LABELS,
  getCurrentTier,
  getExplorerUrl,
  SOLANA_NETWORK,
} from "@/lib/constants";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ArrowLeft, Wallet, Loader2, ExternalLink, Shield, Vote, RotateCcw, Coins } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function BackCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { backCampaign: backCampaignTx } = useQadamProgram();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const { data: campaignData } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  // Fetch wallet balance
  useEffect(() => {
    if (connected && publicKey && connection) {
      connection.getBalance(publicKey).then((bal) => {
        setWalletBalance(bal / LAMPORTS_PER_SOL);
      }).catch(() => setWalletBalance(null));
    } else {
      setWalletBalance(null);
    }
  }, [connected, publicKey, connection]);

  const campaign = campaignData?.data;

  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  // Guard: only active campaigns accept backings
  if (campaign.status !== "active") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {campaign.status === "completed" ? "Campaign fully funded" :
           campaign.status === "refunded" ? "Campaign refunded" :
           "Campaign not accepting backings"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {campaign.status === "completed" ? `${campaign.title} reached its goal. Thanks for your interest!` :
           campaign.status === "refunded" ? "Funds have been returned to backers." :
           "This campaign is not currently active."}
        </p>
        <Link href={`/campaigns/${id}`}>
          <Button variant="outline">View campaign</Button>
        </Link>
      </div>
    );
  }

  const amountNum = parseFloat(amount) || 0;
  const tier = getCurrentTier(campaign.backers_count, campaign.tier_config);
  const tierInfo = TIER_LABELS[tier as 1 | 2 | 3] || TIER_LABELS[3];
  const tierMultiplier = campaign.tier_config?.[tier - 1]?.multiplier ?? (tier === 1 ? 1 : tier === 2 ? 0.67 : 0.5);
  const tokensPerLamport = campaign.tokens_per_lamport || 100;
  const baseTokens = amountNum * LAMPORTS_PER_SOL * tokensPerLamport;
  const estimatedTokens = Math.floor(baseTokens * tierMultiplier);
  const belowMinimum = amountNum > 0 && amountNum < MIN_BACKING_SOL;
  const aboveBalance = walletBalance !== null && amountNum > walletBalance;

  const handleBack = async () => {
    if (!connected || !publicKey) return;
    if (amountNum < MIN_BACKING_SOL) return;

    setLoading(true);
    try {
      const { PublicKey } = await import("@solana/web3.js");
      try {
        new PublicKey(campaign.solana_pubkey);
      } catch {
        toast.error("This campaign doesn't have a valid on-chain address. It may be demo data.");
        setLoading(false);
        return;
      }

      const sig = await backCampaignTx(campaign.solana_pubkey, amountNum);
      console.log("Backed:", sig);

      try {
        const { syncBacking } = await import("@/lib/api");
        await syncBacking({
          campaign_pubkey: campaign.solana_pubkey,
          backer_wallet: publicKey!.toBase58(),
          amount_lamports: Math.floor(amountNum * LAMPORTS_PER_SOL),
          tier,
          tokens_allocated: estimatedTokens,
        });
      } catch (e) {
        console.warn("Sync failed:", e);
        toast.warning("On-chain transaction succeeded, but data sync failed. Your position will sync automatically.", { duration: 10000 });
      }

      toast.success("You're now a backer!", {
        description: "View your position in the portfolio.",
        duration: 8000,
        action: { label: "View campaign", onClick: () => router.push(`/campaigns/${id}`) },
      });
      router.push("/portfolio");
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      console.error("Backing failed:", err);
      toast.error("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-page-enter">
      <Link href={`/campaigns/${id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </Link>

      <h1 className="font-display text-3xl tracking-tight mb-2">Back &ldquo;{campaign.title}&rdquo;</h1>
      <p className="text-muted-foreground mb-8">
        Your SOL goes to escrow. Released only when the community approves milestones.
      </p>

      <div className="space-y-6">

        {/* How it works — FIRST, before amount */}
        <div className="border border-black/[0.06] rounded-2xl p-5 space-y-3">
          <p className="font-medium mb-1">How backing works</p>
          <div className="space-y-2.5">
            {[
              { icon: Shield, text: "Your SOL goes to on-chain escrow, not to the creator" },
              { icon: Vote, text: "You can vote to approve or reject each milestone" },
              { icon: RotateCcw, text: "If milestones fail, you can vote for a proportional refund" },
              { icon: Coins, text: "Ownership points released per approved milestone" },
            ].map((item, i) => (
              <p key={i} className="flex items-start gap-2.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="h-3 w-3 text-green-600" />
                </span>
                {item.text}
              </p>
            ))}
          </div>

          {/* Escrow address proof */}
          {campaign.solana_pubkey && !campaign.solana_pubkey.startsWith("demo_") && (
            <div className="pt-3 mt-3 border-t border-black/[0.04]">
              <p className="text-xs text-muted-foreground">
                Funds will lock at:{" "}
                <a
                  href={getExplorerUrl(campaign.solana_pubkey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-amber-600 hover:underline inline-flex items-center gap-1"
                >
                  {campaign.solana_pubkey.slice(0, 8)}...{campaign.solana_pubkey.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Amount input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amount (SOL)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder={`Min ${MIN_BACKING_SOL} SOL`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={MIN_BACKING_SOL}
              step={0.1}
              className="text-lg"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                {[0.5, 1, 2, 5].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(val))}
                  >
                    {val} SOL
                  </Button>
                ))}
              </div>
              {walletBalance !== null && (
                <span className="text-xs text-muted-foreground">
                  Balance: <span className="font-mono tabular-nums">{walletBalance.toFixed(2)}</span> SOL
                </span>
              )}
            </div>
            {belowMinimum && (
              <p className="text-xs text-red-500 mt-2">Minimum {MIN_BACKING_SOL} SOL</p>
            )}
            {aboveBalance && (
              <p className="text-xs text-red-500 mt-2">Exceeds your wallet balance</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Your Tier</span>
              <div className="text-right">
                <Badge className={tierInfo.color}>{tierInfo.name} ({tierInfo.ratio})</Badge>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tier === 1 ? `First ${campaign.tier_config?.[0]?.max_spots || 50} backers — max ownership points` :
                   tier === 2 ? "Early backer — reduced multiplier" :
                   "Supporter — base multiplier"}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ownership points</span>
              <span className="font-mono font-semibold tabular-nums">{estimatedTokens.toLocaleString()} OP</span>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Utility tokens for governance — vote on milestones, refunds, and extensions. Not equity.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your contribution</span>
              <span className="tabular-nums">
                {amountNum > 0 && campaign.goal_lamports > 0
                  ? `${((amountNum * LAMPORTS_PER_SOL / campaign.goal_lamports) * 100).toFixed(1)}% of goal`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-black/[0.04]">
              <span className="text-muted-foreground">Network fee</span>
              <span className="text-muted-foreground tabular-nums">~0.00001 SOL</span>
            </div>
          </CardContent>
        </Card>

        {/* Action */}
        {!connected ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Connect your wallet to back this campaign</p>
            <WalletMultiButton
              style={{
                backgroundColor: "var(--foreground)",
                height: "48px",
                borderRadius: "9999px",
                fontSize: "15px",
                padding: "0 32px",
                lineHeight: "48px",
                width: "100%",
                justifyContent: "center",
              }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={handleBack}
              disabled={amountNum < MIN_BACKING_SOL || loading || aboveBalance}
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {loading ? "Confirming..." : `Back with ${amountNum || 0} SOL`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your wallet will ask you to confirm the transaction.
            </p>
            {SOLANA_NETWORK === "devnet" && (
              <p className="text-xs text-center text-amber-600 font-medium">
                Devnet — no real funds will be transferred
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
