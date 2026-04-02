"use client";

import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
}

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const tweetText = encodeURIComponent(
    `${title}\n\n${description ? description.slice(0, 100) + "..." : ""}\n\nBack it on @QadamProtocol`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Share2 className="h-3.5 w-3.5" />
          Twitter
        </Button>
      </a>
      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Share2 className="h-3.5 w-3.5" />
          Telegram
        </Button>
      </a>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={copyLink}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>
    </div>
  );
}
