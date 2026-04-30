"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol, SOLANA_NETWORK } from "@/lib/constants";
import {
  ExternalLink, Star, CheckCircle2, XCircle, Loader2,
  GitBranch as GithubIcon, Calendar, Trophy, Wallet,
} from "lucide-react";
import Link from "next/link";

async function getProfile(wallet: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const res = await fetch(`${API_URL}/profiles/${wallet}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export default function ProfilePage() {
  const { wallet } = useParams<{ wallet: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", wallet],
    queryFn: () => getProfile(wallet),
    enabled: !!wallet,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profile = data?.data;
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Profile not found</h1>
      </div>
    );
  }

  const explorerUrl = SOLANA_NETWORK === "devnet"
    ? `https://explorer.solana.com/address/${wallet}?cluster=devnet`
    : `https://explorer.solana.com/address/${wallet}`;

  const rep = profile.reputation;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {(profile.display_name || wallet)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.display_name || `${wallet.slice(0, 8)}...${wallet.slice(-4)}`}
          </h1>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {profile.location && (
              <span className="text-xs text-muted-foreground">📍 {profile.location}</span>
            )}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-muted-foreground hover:text-amber-600 flex items-center gap-1"
            >
              {wallet.slice(0, 8)}...{wallet.slice(-4)}
              <ExternalLink className="h-3 w-3" />
            </a>
            {profile.github_verified && profile.github_username && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <GithubIcon className="h-3 w-3" />
                {profile.github_username}
              </Badge>
            )}
            {profile.member_since && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(profile.member_since).toLocaleDateString()}
              </span>
            )}
          </div>
          {/* Social links */}
          {profile.socials && Object.values(profile.socials).some(Boolean) && (
            <div className="flex items-center gap-3 mt-2">
              {profile.socials.twitter && (
                <a href={`https://x.com/${profile.socials.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">𝕏 {profile.socials.twitter}</a>
              )}
              {profile.socials.telegram && (
                <a href={`https://t.me/${profile.socials.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">TG {profile.socials.telegram}</a>
              )}
              {profile.socials.github && (
                <a href={`https://github.com/${profile.socials.github}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">GH {profile.socials.github}</a>
              )}
              {profile.socials.website && (
                <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">🌐 Website</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{rep?.score ?? "---"}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-3 w-3 text-amber-500" /> Reputation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{profile.campaigns_count}</p>
            <p className="text-xs text-muted-foreground">Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{profile.backed_count}</p>
            <p className="text-xs text-muted-foreground">Backed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{rep?.campaigns_completed ?? 0}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3 text-green-500" /> Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reputation detail */}
      {rep && (
        <div className="border border-black/[0.06] rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-sm mb-3">Reputation Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{rep.milestones_on_time} milestones on time</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-muted-foreground">{rep.milestones_late} milestones late</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{rep.campaigns_completed} campaigns completed</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-muted-foreground">{rep.campaigns_refunded} campaigns refunded</span>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns */}
      <h3 className="font-semibold mb-4">Campaigns</h3>
      {profile.campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet</p>
      ) : (
        <div className="space-y-3">
          {profile.campaigns.map((c: any) => (
            <Link key={c.id} href={`/campaigns/${c.id}`}>
              <div className="border border-black/[0.06] rounded-xl p-4 hover:border-black/[0.12] transition-colors flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{c.status}</Badge>
                    {c.category && <span className="text-xs text-muted-foreground">{c.category}</span>}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular-nums">{formatSol(c.raised_lamports)}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.milestones_approved}/{c.milestones_count} milestones
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
