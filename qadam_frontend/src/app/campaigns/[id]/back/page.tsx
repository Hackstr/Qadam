"use client";

import { useState } from "react";
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
  formatSol,
  lamportsToSol,
  MIN_BACKING_SOL,
  TIER_LABELS,
  TIER_1_MAX_BACKERS,
  TIER_2_MAX_BACKERS,
} from "@/lib/constants";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BackCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { backCampaign: backCampaignTx } = useQadamProgram();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: campaignData } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const campaign = campaignData?.data;

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  const amountNum = parseFloat(amount) || 0;
  const amountLamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
  const tier = campaign.backers_count < TIER_1_MAX_BACKERS ? 1 : campaign.backers_count < TIER_2_MAX_BACKERS ? 2 : 3;
  const tierInfo = TIER_LABELS[tier as 1 | 2 | 3];

  // Estimated tokens — tokens_per_lamport is actually "tokens per SOL" in seed data
  const tokensPerSol = campaign.tokens_per_lamport || 100;
  const baseTokens = amountNum * tokensPerSol;
  const tierMultiplier = tier === 1 ? 1 : tier === 2 ? 0.67 : 0.5;
  const estimatedTokens = Math.floor(baseTokens * tierMultiplier);

  const handleBack = async () => {
    if (!connected || !publicKey) return;
    if (amountNum < MIN_BACKING_SOL) return;

    setLoading(true);
    try {
      // Validate pubkey is a real Solana address before calling Anchor
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

      // Sync backing to PostgreSQL
      try {
        const { syncBacking } = await import("@/lib/api");
        await syncBacking({
          campaign_pubkey: campaign.solana_pubkey,
          backer_wallet: publicKey!.toBase58(),
          amount_lamports: Math.floor(amountNum * LAMPORTS_PER_SOL),
          tier,
          tokens_allocated: estimatedTokens,
        });
      } catch (e) { console.warn("Sync failed:", e); }

      toast.success("Backed successfully!");
      router.push(`/campaigns/${id}`);
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      console.error("Backing failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Link href={`/campaigns/${id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to campaign
      </Link>

      <h1 className="text-2xl font-bold mb-2">Back &ldquo;{campaign.title}&rdquo;</h1>
      <p className="text-muted-foreground mb-8">
        Your SOL goes to escrow. Released only when milestones are verified.
      </p>

      <div className="space-y-6">
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
            <div className="flex gap-2 mt-3">
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
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Tier</span>
              <Badge className={tierInfo.color}>{tierInfo.name} ({tierInfo.ratio})</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Share</span>
              <span className="font-semibold">{estimatedTokens.toLocaleString()} share</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Your share gives you governance rights — vote on extensions and refunds.
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaign Progress</span>
              <span>{formatSol(campaign.raised_lamports)} / {formatSol(campaign.goal_lamports)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Understanding mechanics */}
        <Card>
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-medium mb-2">Before you back, understand:</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                Your SOL goes to on-chain escrow, not to the creator
              </p>
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                You can vote to approve or reject each milestone
              </p>
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                If milestones fail, you can vote for a proportional refund
              </p>
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /></span>
                Project tokens released per approved milestone
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action */}
        {!connected ? (
          <p className="text-center text-muted-foreground">
            Connect your wallet to back this campaign
          </p>
        ) : (
          <Button
            onClick={handleBack}
            disabled={amountNum < MIN_BACKING_SOL || loading}
            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {loading ? "Confirming..." : `Back with ${amountNum || 0} SOL`}
          </Button>
        )}
      </div>
    </div>
  );
}
