import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Cpu, Coins, Eye } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Powered by Solana &middot; Verified by AI
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Crowdfunding where{" "}
          <span className="text-amber-500">progress</span> unlocks funding
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Backers&apos; SOL stays in escrow. AI verifies each milestone. Creators
          get paid only for real progress. Backers become co-owners through
          tokens.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/campaigns">
            <Button size="lg" className="gap-2 bg-[#0F1724] hover:bg-[#1a2538]">
              Explore Campaigns
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/create">
            <Button size="lg" variant="outline" className="gap-2">
              Start a Campaign
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Qadam Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Create Campaign", desc: "Define your project, milestones, and funding goal" },
              { step: "2", title: "Backers Fund", desc: "SOL goes to smart contract escrow, not to creator" },
              { step: "3", title: "AI Verifies", desc: "Submit evidence, Claude AI evaluates completion" },
              { step: "4", title: "Funds Release", desc: "Approved? SOL transfers to creator automatically" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-4">
                <Card className="text-center w-56 flex-shrink-0">
                  <CardContent className="pt-6 pb-5">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-1.5">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
                {idx < 3 && (
                  <ArrowRight className="h-5 w-5 text-amber-500 hidden md:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Qadam?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">Milestone Escrow</h3>
              <p className="text-sm text-muted-foreground">Funds can&apos;t leave without proof of progress. Smart contract enforces it.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">AI Verification</h3>
              <p className="text-sm text-muted-foreground">Claude AI evaluates evidence objectively. Instant, fair, transparent.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Coins className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">Token Equity</h3>
              <p className="text-sm text-muted-foreground">Backers receive project tokens. Not just donors — co-owners.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">On-chain Transparency</h3>
              <p className="text-sm text-muted-foreground">Every decision, every transaction — publicly verifiable on Solana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0F1724] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-3xl font-bold text-amber-500">2.5%</p>
              <p className="text-sm text-gray-400 mt-1">Platform fee</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">&lt; 60s</p>
              <p className="text-sm text-gray-400 mt-1">AI verification</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">Free</p>
              <p className="text-sm text-gray-400 mt-1">For first 20 creators</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">100%</p>
              <p className="text-sm text-gray-400 mt-1">On-chain</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Whether you&apos;re a creator seeking funding or a backer looking for
            early-stage opportunities — Qadam is for you.
          </p>
          <Link href="/campaigns">
            <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
