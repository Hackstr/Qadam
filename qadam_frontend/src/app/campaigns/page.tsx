"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["All", "Apps", "Games", "SaaS", "Tools", "Infrastructure"];
const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "All", value: undefined },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<string | undefined>("active");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", status, category],
    queryFn: () => getCampaigns({ status, category, limit: 50 }),
  });

  const campaigns = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Campaigns</h1>
        <p className="text-muted-foreground">
          Find projects to back. Your SOL stays safe until milestones are verified.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUSES.map((s) => (
          <Button
            key={s.label}
            variant={status === s.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}
        <div className="w-px bg-border mx-2" />
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={category === (cat === "All" ? undefined : cat) ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setCategory(cat === "All" ? undefined : cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Campaigns grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No campaigns found</p>
          <p className="text-sm mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
