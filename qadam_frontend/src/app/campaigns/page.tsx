"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "@/lib/api";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

const CATEGORIES = ["All", "Apps", "Games", "SaaS", "Tools", "Infrastructure"];
const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "All", value: undefined },
];

export default function CampaignsPage() {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", status, category],
    queryFn: () => getCampaigns({ status, category, limit: 50 }),
    retry: false,
  });

  const campaigns = data?.data || [];

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
