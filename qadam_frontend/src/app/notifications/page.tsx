"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNotifications, markNotificationsRead } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, Loader2, CheckCircle2, XCircle, Vote,
  Coins, MessageSquare, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, typeof Bell> = {
  milestone_approved: CheckCircle2,
  milestone_rejected: XCircle,
  milestone_submitted: AlertTriangle,
  vote_opened: Vote,
  refund_available: Coins,
  campaign_update: MessageSquare,
};

const COLOR_MAP: Record<string, string> = {
  milestone_approved: "text-green-500",
  milestone_rejected: "text-red-500",
  milestone_submitted: "text-amber-500",
  vote_opened: "text-purple-500",
  refund_available: "text-blue-500",
  campaign_update: "text-muted-foreground",
};

export default function NotificationsPage() {
  const { connected } = useWallet();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: connected,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications: any[] = data?.data || [];
  const unread = notifications.filter((n: any) => !n.read);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">Connect your wallet to see notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Notifications</h1>
          {unread.length > 0 && (
            <Badge className="bg-amber-500 text-white">{unread.length}</Badge>
          )}
        </div>
        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markReadMutation.mutate()}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 border border-black/[0.06] rounded-2xl">
          <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            You'll be notified about milestone updates, votes, and refunds.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const color = COLOR_MAP[n.type] || "text-muted-foreground";
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.read ? "border-black/[0.04] bg-white" : "border-amber-200 bg-amber-50/30"
                }`}
              >
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(n.inserted_at).toLocaleString()}
                  </p>
                </div>
                {n.campaign_id && (
                  <Link href={`/campaigns/${n.campaign_id}`} className="text-xs text-amber-600 hover:underline flex-shrink-0">
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
