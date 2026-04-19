"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Bell, User } from "lucide-react";
import { toast } from "sonner";

export function AccountSetupModal() {
  const { connected, publicKey } = useWallet();
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifyApproved, setNotifyApproved] = useState(true);
  const [notifyRejected, setNotifyRejected] = useState(true);
  const [notifyVote, setNotifyVote] = useState(true);
  const [notifyRefund, setNotifyRefund] = useState(true);
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: connected && isAuthenticated(),
    retry: false,
  });

  // Show modal after 45s delay if user has no display_name and no email (first time)
  useEffect(() => {
    if (!userData?.data) return;
    if (userData.data.display_name || userData.data.email) return;

    const timer = setTimeout(() => setOpen(true), 45_000);
    return () => clearTimeout(timer);
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setOpen(false);
      toast.success("Account saved");
    },
    onError: () => {
      toast.error("Failed to save. Try again.");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      display_name: displayName || undefined,
      email: email || undefined,
      notify_milestone_approved: notifyApproved,
      notify_milestone_rejected: notifyRejected,
      notify_governance_vote: notifyVote,
      notify_refund_available: notifyRefund,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Your Account
          </DialogTitle>
          <DialogDescription>
            Optional but recommended. Get notified about your campaigns and investments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Identity */}
          <div>
            <label className="text-sm font-medium mb-1 block">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="For notifications only"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Never shared. Only for milestone and voting notifications.
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notifications</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Milestone approved / released", value: notifyApproved, set: setNotifyApproved },
                { label: "Milestone rejected", value: notifyRejected, set: setNotifyRejected },
                { label: "Governance votes", value: notifyVote, set: setNotifyVote },
                { label: "Refund available", value: notifyRefund, set: setNotifyRefund },
              ].map((pref) => (
                <label key={pref.label} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pref.value}
                    onChange={(e) => pref.set(e.target.checked)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
