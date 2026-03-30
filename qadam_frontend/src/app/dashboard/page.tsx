"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Send } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { publicKey, connected } = useWallet();

  const { data, isLoading } = useQuery({
    queryKey: ["my-campaigns", publicKey?.toBase58()],
    queryFn: () => getCampaigns({ status: undefined }),
    enabled: connected,
  });

  // Filter to only show campaigns created by this wallet
  const myCampaigns = (data?.data || []).filter(
    (c) => c.creator_wallet === publicKey?.toBase58()
  );

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <p className="text-muted-foreground">Connect your wallet to view your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your campaigns, submit evidence, track milestones.
          </p>
        </div>
        <Link href="/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : myCampaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground mb-4">No campaigns yet</p>
          <Link href="/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCampaigns.map((campaign) => (
            <div key={campaign.id} className="space-y-2">
              <CampaignCard campaign={campaign} />
              {campaign.status === "active" && campaign.milestones_approved < campaign.milestones_count && (
                <Link href={`/dashboard/${campaign.id}/submit`}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Submit Evidence
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
