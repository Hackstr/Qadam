"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCampaign } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Send, Copy, Check, Rocket, PenLine, Eye } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id");
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const campaign = data?.data;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/campaigns/${campaignId}` : "";

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      {/* Celebration */}
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <Rocket className="h-12 w-12 text-amber-500" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-3">
          Your campaign is LIVE on Solana!
        </h1>
        {campaign && (
          <p className="text-lg text-muted-foreground">{campaign.title}</p>
        )}
      </div>

      {/* Share card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="font-semibold mb-4">Share it with your community</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just launched "${campaign?.title || "my project"}" on @QadamProtocol — community-governed crowdfunding on Solana!`)}&url=${encodeURIComponent(shareUrl)}`,
                  "_blank"
                );
              }}
            >
              <Share2 className="h-4 w-4" /> Twitter
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out "${campaign?.title || "my project"}" on Qadam!`)}`,
                  "_blank"
                );
              }}
            >
              <Send className="h-4 w-4" /> Telegram
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What's next */}
      <Card className="mb-8 text-left">
        <CardContent className="p-6">
          <p className="font-semibold mb-4">What's next?</p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Share className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Share your campaign everywhere</p>
                <p className="text-xs text-muted-foreground">Twitter, Telegram, personal network. First 24h are critical.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <PenLine className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Post your first update</p>
                <p className="text-xs text-muted-foreground">Momentum matters. Regular updates signal that you're building.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Submit evidence when milestone ready</p>
                <p className="text-xs text-muted-foreground">Community will vote to release funds for that milestone.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/campaigns/${campaignId}`}>
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8" size="lg">
            View my campaign
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2 rounded-full px-8" size="lg">
            Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Share icon (using Send as proxy since Share2 may conflict)
function Share({ className }: { className?: string }) {
  return <Send className={className} />;
}
