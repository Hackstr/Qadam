"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getMe, updateMe } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Settings, GitBranch, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { connected } = useWallet();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: connected,
  });

  const user = data?.data;

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialTelegram, setSocialTelegram] = useState("");
  const [socialGithub, setSocialGithub] = useState("");
  const [socialWebsite, setSocialWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [notifyApproved, setNotifyApproved] = useState(true);
  const [notifyRejected, setNotifyRejected] = useState(true);
  const [notifyVote, setNotifyVote] = useState(true);
  const [notifyRefund, setNotifyRefund] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(true);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setSocialTwitter(user.socials?.twitter || "");
      setSocialTelegram(user.socials?.telegram || "");
      setSocialGithub(user.socials?.github || "");
      setSocialWebsite(user.socials?.website || "");
      setEmail(user.email || "");
      setNotifyApproved(user.notify_milestone_approved ?? true);
      setNotifyRejected(user.notify_milestone_rejected ?? true);
      setNotifyVote(user.notify_governance_vote ?? true);
      setNotifyRefund(user.notify_refund_available ?? true);
      setNotifyUpdates(user.notify_campaign_updates ?? true);
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMe({
        display_name: displayName,
        bio,
        location,
        socials: { twitter: socialTwitter, telegram: socialTelegram, github: socialGithub, website: socialWebsite },
        email,
        notify_milestone_approved: notifyApproved,
        notify_milestone_rejected: notifyRejected,
        notify_governance_vote: notifyVote,
        notify_refund_available: notifyRefund,
        notify_campaign_updates: notifyUpdates,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Connect your wallet to manage settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Account Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your profile and notification preferences.</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Bio</label>
                <span className={`text-xs ${bio.length > 260 ? "text-amber-600" : "text-muted-foreground"}`}>{bio.length}/280</span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                placeholder="A short intro about you"
                maxLength={280}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Social links</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Twitter / X</label>
                  <Input value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} placeholder="@handle" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Telegram</label>
                  <Input value={socialTelegram} onChange={(e) => setSocialTelegram(e.target.value)} placeholder="@username" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">GitHub</label>
                  <Input value={socialGithub} onChange={(e) => setSocialGithub(e.target.value)} placeholder="username" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Website</label>
                  <Input value={socialWebsite} onChange={(e) => setSocialWebsite(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              {user?.email && (
                <p className={`text-xs mt-1 ${user.email_verified ? "text-green-600" : "text-amber-600"}`}>
                  {user.email_verified ? "Verified" : "Unverified — check your inbox after saving"}
                </p>
              )}
              {!user?.email && <p className="text-xs text-muted-foreground mt-1">Used for notifications only.</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Wallet</label>
              <p className="text-sm font-mono text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                {user?.wallet_address}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">GitHub Verification</label>
              {user?.github_verified ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified as <span className="font-medium">{user.github_username}</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    try {
                      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
                      const token = localStorage.getItem("qadam_token");
                      const res = await fetch(`${API_URL}/auth/github`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.open(data.url, "_blank", "width=600,height=700");
                      } else {
                        toast.error("GitHub OAuth not configured");
                      }
                    } catch {
                      toast.error("Failed to start GitHub auth");
                    }
                  }}
                >
                  <GitBranch className="h-4 w-4" />
                  Connect GitHub
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-1">Verified creators get a badge on their campaigns.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Milestone approved", value: notifyApproved, set: setNotifyApproved },
              { label: "Milestone rejected", value: notifyRejected, set: setNotifyRejected },
              { label: "Governance votes", value: notifyVote, set: setNotifyVote },
              { label: "Refund available", value: notifyRefund, set: setNotifyRefund },
              { label: "Campaign updates", value: notifyUpdates, set: setNotifyUpdates },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">{item.label}</span>
                <button
                  type="button"
                  onClick={() => item.set(!item.value)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    item.value ? "bg-amber-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      item.value ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full gap-2"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
