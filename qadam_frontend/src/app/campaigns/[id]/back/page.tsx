"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getCampaign } from "@/lib/api";
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
  const { connection } = useConnection();
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

  // Estimated tokens
  const tokensPerLamport = 100; // TODO: read from campaign
  const baseTokens = amountLamports * tokensPerLamport;
  const tierMultiplier = tier === 1 ? 1 : tier === 2 ? 0.67 : 0.5;
  const estimatedTokens = Math.floor(baseTokens * tierMultiplier);

  const handleBack = async () => {
    if (!connected || !publicKey) return;
    if (amountNum < MIN_BACKING_SOL) return;

    setLoading(true);
    try {
      // TODO: Build and send Anchor transaction via wallet adapter
      // const tx = await program.methods.backCampaign(new BN(amountLamports))...
      alert("Backing transaction would be sent here. Connect to Anchor program to enable.");
      router.push(`/campaigns/${id}`);
    } catch (err) {
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
              <span className="text-muted-foreground">Estimated Tokens</span>
              <span className="font-semibold">{estimatedTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaign Progress</span>
              <span>{formatSol(campaign.raised_lamports)} / {formatSol(campaign.goal_lamports)}</span>
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
