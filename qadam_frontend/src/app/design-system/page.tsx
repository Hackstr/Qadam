"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown, Star, UserCheck, Lock, ExternalLink, CheckCircle2,
  Vote, Clock, AlertTriangle, Loader2, Sparkles, Send,
  Plus, Trash2, Eye, ArrowRight, Search, Bell, Copy,
  Shield, Wallet, ChevronDown, ChevronLeft, ChevronRight,
  Upload, X, Check, Info, AlertCircle, FileText, Link2,
  Image, RotateCcw, Gift, TrendingUp, Users, Coins,
  PenLine, Settings, LogOut, BarChart3, CircleDot,
  Timer, Activity,
} from "lucide-react";

/* ─── Section wrapper ─── */
const S = ({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24">
    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-[2px] mb-1">{title}</p>
    {sub && <h2 className="text-[32px] font-bold tracking-tight leading-tight mb-1">{title.split(" · ")[1] || title.slice(5)}</h2>}
    {sub && <p className="text-sm text-muted-foreground mb-8">{sub}</p>}
    {!sub && <Separator className="mb-8" />}
    {children}
  </section>
);

/* ─── Sub-card ─── */
const SubCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl bg-white border border-black/[0.06] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

/* ─── Label ─── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-[1px] mb-2">{children}</p>
);

export default function DesignSystemPage() {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-[72px]">
      {/* ═══ HEADER ═══ */}
      <div>
        <Badge className="bg-amber-100 text-amber-700 mb-4">Qadam Design System v2</Badge>
        <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-5 leading-[1]">Build step by step.</h1>
        <p className="text-muted-foreground text-lg max-w-[720px] leading-relaxed">
          Typography with gravity. Warm neutrals with clear hierarchy. Every element
          rounded, soft-shadowed, generously spaced. A system that feels mercantile and
          honest — not loud, not cold.
        </p>
      </div>

      <Separator />

      {/* ═══ 01 TYPOGRAPHY ═══ */}
      <S id="typography" title="01 · Typography" sub="Instrument Serif for display. Inter for UI. Geist Mono for wallets and hashes.">
        <SubCard>
          <div className="space-y-6">
            {[
              { label: "Display XL", spec: "Serif 72 · -1.5", el: <p className="font-display text-5xl md:text-6xl tracking-tight leading-[1]">Build step by step.</p> },
              { label: "Display L", spec: "Serif 48 · -1.1", el: <p className="font-display text-4xl tracking-tight">Crowdfunding that works.</p> },
              { label: "H1", spec: "Sans 700 · 32 · 1.25", el: <p className="text-3xl font-bold tracking-tight">Qadam Platform Development</p> },
              { label: "H2", spec: "Sans 700 · 24 · 1.25", el: <p className="text-2xl font-bold">What you get as a backer</p> },
              { label: "H3", spec: "Sans 600 · 20 · 1.3", el: <p className="text-xl font-semibold">Milestone journey</p> },
              { label: "Body L", spec: "Sans 400 · 18 · 1.55", el: <p className="text-lg leading-relaxed">Nomad is building a banking layer for the 35 million people who work from anywhere.</p> },
              { label: "Body", spec: "Sans 400 · 15 · 1.55", el: <p className="leading-relaxed">Your SOL stays in a smart contract — released only when the community approves.</p> },
              { label: "Caption", spec: "Sans 400 · 12 · 1.45", el: <p className="text-xs text-muted-foreground">49 Founders spots left · ends in 2d 14h</p> },
              { label: "Overline", spec: "Sans 700 · 11 · 1.85 · UPPER", el: <p className="text-[11px] font-bold tracking-[1.85px] uppercase text-amber-600">Apps · Digital Nomads</p> },
              { label: "Mono", spec: "Geist Mono 400 · 13", el: <p className="font-mono text-[13px]">E5k4pce2gbPhd2y3rBVfCnNKe4hqVJvsuswaNZGEA9nz</p> },
            ].map((row, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-6" />}
                <div className="flex items-baseline gap-6">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-xs font-medium">{row.label}</span>
                    <p className="text-[10px] text-muted-foreground">{row.spec}</p>
                  </div>
                  <div className="flex-1">{row.el}</div>
                </div>
              </div>
            ))}
          </div>
        </SubCard>
      </S>

      {/* ═══ 02 COLOR ═══ */}
      <S id="color" title="02 · Color" sub="Amber for action. Ink for structure. Warm neutrals for surfaces. Semantic colors with purpose.">
        <div className="space-y-8">
          <div>
            <p className="text-sm font-semibold mb-3">Brand — Amber</p>
            <div className="flex gap-2">
              {[
                { name: "50", color: "#FFF8E7" },
                { name: "100", color: "#FEF3C7" },
                { name: "200", color: "#FDE68A" },
                { name: "300", color: "#FCD34D" },
                { name: "500 · primary", color: "#F59E0B" },
                { name: "600 · hover", color: "#D97706" },
                { name: "700", color: "#B45309" },
                { name: "900 · text", color: "#78350F" },
              ].map((c) => (
                <div key={c.name} className="flex-1">
                  <div className="h-16 rounded-xl mb-1.5" style={{ backgroundColor: c.color }} />
                  <p className="text-[10px] font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{c.color}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Neutrals</p>
            <div className="flex gap-2">
              {[
                { name: "surface", color: "#FAFAFA" },
                { name: "bg", color: "#F5F5F5" },
                { name: "soft", color: "#E5E7EB" },
                { name: "border", color: "#D1D5DB" },
                { name: "muted", color: "#6B7280" },
                { name: "soft text", color: "#374151" },
                { name: "ink", color: "#0F172A" },
              ].map((c) => (
                <div key={c.name} className="flex-1">
                  <div className="h-16 rounded-xl mb-1.5 border border-black/[0.06]" style={{ backgroundColor: c.color }} />
                  <p className="text-[10px] font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{c.color}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Semantic</p>
            <div className="flex gap-4">
              {[
                { name: "Success", color: "#10B981" },
                { name: "Action", color: "#F59E0B" },
                { name: "Danger", color: "#EF4444" },
                { name: "Governance", color: "#8B5CF6" },
                { name: "Info", color: "#3B82F6" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: c.color }} />
                  <div>
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </S>

      {/* ═══ 03 FOUNDATIONS ═══ */}
      <S id="foundations" title="03 · Foundations" sub="Rhythm of 4. Radii stay soft. Shadows stay quiet.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SubCard>
            <p className="text-base font-bold mb-1">Spacing</p>
            <p className="text-xs text-muted-foreground mb-4">Scale of 4 · for padding, gap, offsets</p>
            <div className="space-y-3">
              {[
                { val: 4, label: "4px — micro" },
                { val: 8, label: "8px — tight" },
                { val: 16, label: "16px — default" },
                { val: 24, label: "24px — relaxed" },
                { val: 32, label: "32px — section" },
                { val: 48, label: "48px — large" },
              ].map((s) => (
                <div key={s.val} className="flex items-center gap-3">
                  <div className="bg-amber-300 rounded" style={{ width: s.val, height: 12 }} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Radii</p>
            <p className="text-xs text-muted-foreground mb-4">Soft by default · pill for interactive</p>
            <div className="space-y-3">
              {[
                { val: 6, label: "6px — small" },
                { val: 10, label: "10px — badge/chip" },
                { val: 12, label: "12px — input" },
                { val: 14, label: "14px — card inner" },
                { val: 20, label: "20px — card" },
                { val: 9999, label: "pill — button" },
              ].map((r) => (
                <div key={r.val} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 border-2 border-amber-200 flex items-center justify-center" style={{ borderRadius: r.val }}>
                    <span className="text-[9px] text-amber-700">{r.val === 9999 ? "∞" : r.val}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                </div>
              ))}
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Shadows</p>
            <p className="text-xs text-muted-foreground mb-4">Quiet elevation · never dramatic</p>
            <div className="space-y-3">
              {[
                { label: "sm — subtle", shadow: "0 1px 2px rgba(0,0,0,0.04)" },
                { label: "md — card", shadow: "0 2px 12px rgba(0,0,0,0.05)" },
                { label: "lg — dropdown", shadow: "0 4px 20px rgba(0,0,0,0.06)" },
                { label: "xl — modal", shadow: "0 8px 32px rgba(0,0,0,0.08)" },
                { label: "glow — CTA", shadow: "0 0 16px rgba(245,158,11,0.25)" },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-white rounded-xl text-xs flex items-center justify-between" style={{ boxShadow: s.shadow }}>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </SubCard>
        </div>
        {/* Dividers */}
        <div className="mt-4">
          <SubCard>
            <Label>Dividers</Label>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-2">Hair — 1px, 6% black</p>
                <div className="h-px bg-black/[0.06] w-full" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-2">Standard — 1px, 10% black</p>
                <div className="h-px bg-black/10 w-full" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-2">Accent dot — centered diamond separator</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-px bg-black/10 flex-1" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rotate-45" />
                  <div className="h-px bg-black/10 flex-1" />
                </div>
              </div>
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 04 COMPONENTS ═══ */}
      <S id="components" title="04 · Components" sub="Buttons · Inputs · Badges · Tier rewards · Cards · Signature patterns.">
        {/* Buttons */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Buttons</p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2" size="lg"><Plus className="h-4 w-4" /> Primary Large</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2"><Plus className="h-4 w-4" /> Primary</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2" size="sm">Primary SM</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="outline" className="rounded-full gap-2" size="lg"><Eye className="h-4 w-4" /> Secondary Large</Button>
              <Button variant="outline" className="rounded-full gap-2"><Eye className="h-4 w-4" /> Secondary</Button>
              <Button variant="outline" className="rounded-full gap-2" size="sm">Secondary SM</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="ghost" className="gap-2"><ArrowRight className="h-4 w-4" /> Ghost</Button>
              <Button variant="destructive" className="rounded-full gap-2"><Trash2 className="h-4 w-4" /> Destructive</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full gap-2"><Vote className="h-4 w-4" /> Governance</Button>
              <Button disabled className="rounded-full">Disabled</Button>
            </div>
          </div>
        </SubCard>

        {/* Inputs */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Inputs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Default</label>
              <Input placeholder="Project name..." />
              <p className="text-[11px] text-muted-foreground mt-1">A memorable one-line name. You can edit this later.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">With value</label>
              <Input defaultValue="Nomad — Banking for Remote Workers" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Textarea</label>
              <Textarea placeholder="Describe your project..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search campaigns, creators, keywords" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select</label>
              <div className="flex items-center justify-between h-11 px-3.5 rounded-xl border border-black/[0.08] bg-white">
                <span className="text-muted-foreground text-[15px]">Choose category</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </SubCard>

        {/* Badges */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Badges & Pills</p>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-50 text-green-700 border border-green-200">Active</Badge>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Completed</Badge>
                <Badge className="bg-red-50 text-red-700 border border-red-200">Refunded</Badge>
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Paused</Badge>
                <Badge className="bg-gray-100 text-gray-600">Draft</Badge>
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Infrastructure</Badge>
                <Badge variant="secondary">Apps</Badge>
                <Badge variant="secondary">Games</Badge>
                <Badge variant="secondary">SaaS</Badge>
                <Badge variant="secondary">Tools</Badge>
              </div>
            </div>
            <div>
              <Label>Funding</Label>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-50 text-green-700 text-xs">Funded</Badge>
                <Badge className="bg-amber-50 text-amber-700 text-xs">75% funded</Badge>
                <Badge className="bg-amber-100 text-amber-800 text-[10px]">3</Badge>
              </div>
            </div>
          </div>
        </SubCard>

        {/* Tier Rewards */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Tier Rewards</p>
          <div className="space-y-3 max-w-lg">
            {[
              { icon: Crown, name: "Founders", sub: "First 50 backers", pts: "1.0 pts/SOL", spots: "49 of 50 left", bg: "bg-green-50", border: "border-green-100", text: "text-green-700", sub2: "text-green-600" },
              { icon: Star, name: "Early Backers", sub: "Backers 51–250", pts: "0.67 pts/SOL", spots: "200 spots", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", sub2: "text-amber-600" },
              { icon: UserCheck, name: "Supporters", sub: "Everyone after 250", pts: "0.5 pts/SOL", spots: "Unlimited", bg: "bg-gray-50", border: "border-gray-100", text: "text-gray-600", sub2: "text-gray-500" },
            ].map((t) => (
              <div key={t.name} className={`flex items-center justify-between p-4 rounded-xl ${t.bg} border ${t.border}`}>
                <div className="flex items-center gap-3">
                  <t.icon className={`h-5 w-5 ${t.sub2}`} />
                  <div>
                    <p className={`font-semibold ${t.text}`}>{t.name}</p>
                    <p className={`text-xs ${t.sub2}`}>{t.sub}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.text}`}>{t.pts}</p>
                  <p className={`text-xs ${t.sub2}`}>{t.spots}</p>
                </div>
              </div>
            ))}
          </div>
        </SubCard>

        {/* Cards */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Cards</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-5"><p className="font-semibold text-sm mb-1">Default Card</p><p className="text-xs text-muted-foreground">White bg, subtle border, for data display.</p></CardContent></Card>
            <Card className="bg-amber-50/50 border-amber-100"><CardContent className="p-5"><p className="font-semibold text-sm mb-1">Soft Card</p><p className="text-xs text-muted-foreground">Warm tinted bg for highlights and alerts.</p></CardContent></Card>
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white"><p className="font-semibold text-sm mb-1">Accent Card</p><p className="text-xs text-white/80">Gradient for hero CTAs and premium sections.</p></div>
          </div>
        </SubCard>

        {/* Signature Components */}
        <SubCard>
          <p className="text-base font-bold mb-4">Signature Components</p>
          <div className="space-y-6">
            <div>
              <Label>Escrow Indicator</Label>
              <div className="flex items-center gap-2 text-xs p-3 bg-green-50 border border-green-100 rounded-lg max-w-md">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700">37.5 SOL locked in on-chain escrow</span>
                <ExternalLink className="h-3 w-3 ml-auto text-green-500" />
              </div>
            </div>
            <div>
              <Label>Milestone Dots</Label>
              <div className="flex items-center gap-0 max-w-md">
                {[true, true, "current", false, false].map((m, i) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      m === true ? "bg-green-500" : m === "current" ? "bg-purple-500 ring-4 ring-purple-100" : "bg-gray-200"
                    }`}>
                      {m === true && <Check className="h-3 w-3 text-white" />}
                      {m === "current" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {i < 4 && <div className={`flex-1 h-0.5 ${m === true ? "bg-green-300" : "bg-gray-100"}`} />}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Active Vote Card</Label>
              <Card className="max-w-sm border-purple-200 bg-purple-50/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <p className="text-sm font-semibold text-purple-700">Community is voting</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 2d 14h</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Milestone 2: API public release</p>
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "73%" }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">73% YES · 15 of 23 backers voted</p>
                  <Button size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full">
                    <Vote className="h-3.5 w-3.5" /> Cast your vote
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div>
              <Label>AI Attribution</Label>
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 gap-1">
                  <Sparkles className="h-3 w-3" /> AI-generated
                </Badge>
                <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                  <Sparkles className="h-3.5 w-3.5" /> Help me write this
                </Button>
              </div>
            </div>
          </div>
        </SubCard>
      </S>

      {/* ═══ 05 ICONS & AVATARS ═══ */}
      <S id="icons" title="05 · Icons & Avatars" sub="Lucide icon set · 6 sizes · 5 avatar sizes with fallback states.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SubCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold">Icon Sizes</p>
              <span className="text-[11px] text-muted-foreground">Lucide · weight 2px</span>
            </div>
            <div className="flex items-end gap-5 mb-6">
              {[
                { size: 12, label: "12" },
                { size: 14, label: "14" },
                { size: 16, label: "16" },
                { size: 20, label: "20" },
                { size: 24, label: "24" },
                { size: 32, label: "32" },
              ].map((s) => (
                <div key={s.size} className="flex flex-col items-center gap-1.5">
                  <Shield style={{ width: s.size, height: s.size }} className="text-foreground" />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-4" />
            <Label>Key Icons in Qadam</Label>
            <div className="flex flex-wrap gap-5">
              {[
                { icon: Shield, label: "Escrow" },
                { icon: Vote, label: "Vote" },
                { icon: Coins, label: "Tokens" },
                { icon: Crown, label: "Founders" },
                { icon: Star, label: "Early" },
                { icon: Lock, label: "Lock" },
                { icon: Sparkles, label: "AI" },
                { icon: Gift, label: "Claim" },
                { icon: RotateCcw, label: "Refund" },
                { icon: Bell, label: "Notify" },
                { icon: Wallet, label: "Wallet" },
                { icon: ExternalLink, label: "External" },
              ].map((ic) => (
                <div key={ic.label} className="flex flex-col items-center gap-1">
                  <ic.icon className="h-5 w-5 text-foreground" />
                  <span className="text-[10px] text-muted-foreground">{ic.label}</span>
                </div>
              ))}
            </div>
          </SubCard>
          <SubCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold">Avatars</p>
              <span className="text-[11px] text-muted-foreground">Gradient fallback · initials</span>
            </div>
            <div className="flex items-end gap-4 mb-6">
              {[24, 32, 40, 48, 64].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <div className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold" style={{ width: s, height: s, fontSize: s * 0.4 }}>
                    K
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
            <Separator className="mb-4" />
            <Label>States</Label>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">K</div>
                <span className="text-[10px] text-muted-foreground">Initials</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><Users className="h-4 w-4 text-gray-400" /></div>
                <span className="text-[10px] text-muted-foreground">Empty</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Loading</span>
              </div>
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 06 NAVIGATION ═══ */}
      <S id="navigation" title="06 · Navigation" sub="Header · breadcrumbs · tabs · pagination.">
        <SubCard>
          <Label>Header — centered pill, logo + nav + wallet</Label>
          <div className="flex items-center justify-center bg-[#FAFAFA] rounded-2xl h-20 px-6 mb-6">
            <div className="flex items-center gap-1 bg-white rounded-full border border-black/[0.06] shadow-sm h-11 px-1.5">
              <span className="px-3 py-1 text-sm font-bold">Qadam</span>
              <div className="w-px h-[18px] bg-black/10" />
              <span className="px-3 py-1 text-sm bg-black/[0.06] rounded-full">Discover</span>
              <span className="px-3 py-1 text-sm text-muted-foreground">Create</span>
              <span className="px-3 py-1 text-sm text-muted-foreground">My Campaigns</span>
              <span className="px-3 py-1 text-sm text-muted-foreground">My Backed</span>
              <div className="w-px h-[18px] bg-black/10" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center"><Bell className="h-4 w-4 text-muted-foreground" /></div>
              <div className="flex items-center gap-1.5 bg-[#0F172A] text-white text-xs font-medium rounded-full px-3.5 h-8">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                E5k4..A9nz
              </div>
            </div>
          </div>

          <Label>Breadcrumbs</Label>
          <div className="flex items-center gap-2 mb-6">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Discover</span>
          </div>

          <Label>Tabs — bottom border amber when active</Label>
          <div className="flex items-center gap-7 border-b border-black/[0.04] mb-6">
            {["About", "Milestones", "Updates", "Backers", "FAQ"].map((t, i) => (
              <span key={t} className={`text-sm pb-3 ${i === 0 ? "font-semibold border-b-2 border-amber-500" : "text-muted-foreground"}`}>
                {t}
                {t === "Updates" && <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-1.5 px-1.5 py-0">3</Badge>}
              </span>
            ))}
          </div>

          <Label>Pagination</Label>
          <div className="flex items-center gap-1.5">
            <div className="w-9 h-9 rounded-[10px] border border-black/[0.08] flex items-center justify-center"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" /></div>
            <div className="w-9 h-9 rounded-[10px] bg-amber-500 text-white text-[13px] font-bold flex items-center justify-center">1</div>
            <div className="w-9 h-9 rounded-[10px] text-[13px] font-medium flex items-center justify-center">2</div>
            <div className="w-9 h-9 rounded-[10px] text-[13px] font-medium flex items-center justify-center">3</div>
            <span className="text-muted-foreground text-sm px-1">…</span>
            <div className="w-9 h-9 rounded-[10px] border border-black/[0.08] flex items-center justify-center"><ChevronRight className="h-3.5 w-3.5" /></div>
          </div>
        </SubCard>
      </S>

      {/* ═══ 07 FORM CONTROLS ═══ */}
      <S id="form-controls" title="07 · Form Controls" sub="Checkbox · Radio · Switch · Select · Search · File upload.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SubCard>
            <p className="text-base font-bold mb-4">Toggles</p>
            <Label>Checkbox</Label>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="w-[18px] h-[18px] rounded accent-amber-500" defaultChecked /> Checked</label>
              <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="w-[18px] h-[18px] rounded" /> Unchecked</label>
            </div>
            <Label>Radio</Label>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2.5 text-sm"><input type="radio" name="ds-radio" className="w-[18px] h-[18px] accent-amber-500" defaultChecked /> Selected</label>
              <label className="flex items-center gap-2.5 text-sm"><input type="radio" name="ds-radio" className="w-[18px] h-[18px]" /> Default</label>
            </div>
            <Label>Switch</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-6 bg-amber-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" /></div>
                <span className="text-sm">On</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-6 bg-gray-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" /></div>
                <span className="text-sm">Off</span>
              </div>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-4">Inputs</p>
            <Label>Select · closed</Label>
            <div className="flex items-center justify-between h-11 px-3.5 rounded-xl border border-black/[0.08] bg-white mb-4">
              <span className="text-muted-foreground text-[15px]">Choose category</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <Label>Search</Label>
            <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl border border-black/[0.08] bg-white mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-[15px] flex-1">Search campaigns</span>
              <span className="text-[10px] text-muted-foreground bg-gray-100 rounded px-2 py-0.5">⌘K</span>
            </div>
            <Label>Fieldset</Label>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">Project name</span>
                <span className="text-[11px] text-muted-foreground">0 / 80</span>
              </div>
              <Input placeholder="Enter project name..." />
              <p className="text-[11px] text-muted-foreground mt-1">A memorable one-line name. You can edit this later.</p>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-4">Upload & Complex</p>
            <Label>File upload — drop zone</Label>
            <div className="flex flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-black/15 bg-[#FAFAFA] h-36 mb-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center mb-2.5"><Upload className="h-5 w-5 text-amber-600" /></div>
              <p className="text-[13px] font-semibold">Drop cover image or click to browse</p>
              <p className="text-[11px] text-muted-foreground">PNG · JPG · up to 5 MB</p>
            </div>
            <Label>Uploaded — success</Label>
            <div className="flex items-center gap-3 rounded-xl border border-green-500 bg-green-50 h-16 px-3.5">
              <div className="w-11 h-11 rounded-lg bg-green-200" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">cover-image.png</p>
                <p className="text-[11px] text-muted-foreground">2.1 MB · Uploaded</p>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"><X className="h-4 w-4 text-muted-foreground" /></div>
            </div>
          </SubCard>
        </div>
        {/* Segmented Control & Stepper */}
        <div className="mt-4">
          <SubCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold">Segmented Control & Steppers</p>
              <span className="text-[11px] text-muted-foreground">toggle groups · numeric inputs</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Segmented Control — 2–4 options, active amber</Label>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-[10px] h-9 p-[3px]">
                  {["All", "Active", "Completed"].map((s, i) => (
                    <div key={s} className={`flex items-center justify-center h-[30px] px-3.5 rounded-lg text-[13px] ${i === 0 ? "bg-white shadow-sm font-semibold" : "text-muted-foreground"}`}>{s}</div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Number Stepper — for SOL amount</Label>
                <div className="flex items-center border border-black/[0.08] rounded-xl h-11 overflow-hidden w-fit">
                  <button className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:bg-gray-50">−</button>
                  <div className="w-[100px] h-11 flex flex-col items-center justify-center border-x border-black/[0.04]">
                    <span className="text-lg font-bold tabular-nums">2.00</span>
                    <span className="text-[9px] text-muted-foreground -mt-0.5">SOL</span>
                  </div>
                  <button className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:bg-gray-50">+</button>
                </div>
              </div>
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 08 FEEDBACK & OVERLAYS ═══ */}
      <S id="feedback" title="08 · Feedback & Overlays" sub="Toasts · modal · tooltip · empty · loading · error states.">
        {/* Toasts */}
        <SubCard className="mb-4">
          <p className="text-base font-bold mb-4">Toasts — top-right · auto-dismiss 4s</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Check, color: "text-green-500", bg: "bg-green-50", title: "Milestone approved", desc: "SOL released to creator" },
              { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", title: "Wallet disconnected", desc: "Reconnect to continue" },
              { icon: X, color: "text-red-500", bg: "bg-red-50", title: "Transaction failed", desc: "Insufficient SOL balance" },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-3 p-3.5 rounded-xl border border-black/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.1)] bg-white">
                <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center flex-shrink-0`}><t.icon className={`h-4 w-4 ${t.color}`} /></div>
                <div><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-muted-foreground">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </SubCard>

        {/* States */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SubCard>
            <p className="text-sm font-bold mb-3">Empty State</p>
            <div className="flex flex-col items-center justify-center bg-[#FAFAFA] rounded-xl h-48 p-5">
              <Wallet className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No backed campaigns yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Discover projects and back with SOL</p>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-1.5 text-xs"><ArrowRight className="h-3 w-3" /> Explore</Button>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-sm font-bold mb-3">Loading / Skeleton</p>
            <div className="bg-[#FAFAFA] rounded-xl p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded-full w-full animate-pulse" />
              <div className="h-3 bg-gray-200 rounded-full w-5/6 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-xl w-full animate-pulse mt-3" />
              <div className="h-10 bg-gray-200 rounded-xl w-full animate-pulse" />
            </div>
          </SubCard>
          <SubCard>
            <p className="text-sm font-bold mb-3">Error State</p>
            <div className="flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-xl h-48 p-5">
              <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
              <p className="text-sm font-medium text-red-700">Failed to load campaigns</p>
              <p className="text-xs text-red-500 mt-1 mb-3">Check connection and try again</p>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs border-red-200 text-red-600"><RotateCcw className="h-3 w-3" /> Retry</Button>
            </div>
          </SubCard>
        </div>

        {/* Modal & Tooltip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
          <SubCard>
            <p className="text-base font-bold mb-1">Modal — centered overlay with scrim</p>
            <div className="flex items-center justify-center bg-black/40 rounded-xl h-[300px] relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-[320px] space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold">Confirm action</p>
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">Are you sure you want to claim your refund? This action cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="rounded-full">Cancel</Button>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-full gap-1"><RotateCcw className="h-3 w-3" /> Claim Refund</Button>
                </div>
              </div>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Tooltip — dark bg on hover</p>
            <div className="flex items-center justify-center bg-[#FAFAFA] rounded-xl h-[220px] flex-col gap-5">
              <div className="relative">
                <div className="bg-[#0F172A] text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  Your SOL is locked in escrow
                </div>
                <div className="w-2 h-2 bg-[#0F172A] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                <Lock className="h-3 w-3" /> 2.00 SOL in escrow
              </div>
              <p className="text-[11px] text-muted-foreground">Dark bg (#0F172A) · white text · small caret · 32px height</p>
            </div>
          </SubCard>
        </div>

        {/* Inline Alerts */}
        <SubCard>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">Inline Alerts & Banners</p>
            <span className="text-[11px] text-muted-foreground">live inside the page · not floating</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-500/15">
              <Info className="h-[18px] w-[18px] text-blue-500 flex-shrink-0" />
              <div className="flex-1"><p className="text-[13px] font-bold text-blue-800">Heads up</p><p className="text-xs text-blue-800">Campaigns on Qadam use a 30-day funding window by default.</p></div>
              <span className="text-xs font-semibold text-blue-800 cursor-pointer">Learn more →</span>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 border border-green-500/15">
              <div className="w-[22px] h-[22px] rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Check className="h-3 w-3 text-white" /></div>
              <div className="flex-1"><p className="text-[13px] font-bold text-green-800">Milestone 1 approved</p><p className="text-xs text-green-700">12.5 SOL was released to the creator. You now hold 2.5 ownership points.</p></div>
              <X className="h-3.5 w-3.5 text-green-700 cursor-pointer flex-shrink-0" />
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-500/20">
              <AlertTriangle className="h-[18px] w-[18px] text-amber-500 flex-shrink-0" />
              <div className="flex-1"><p className="text-[13px] font-bold text-amber-800">Evidence due in 2 days</p><p className="text-xs text-amber-700">Submit evidence for Milestone 2 before voting opens.</p></div>
              <Button size="sm" className="bg-amber-500 text-white h-[30px] px-3 rounded-lg text-xs">Submit</Button>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-500/15">
              <AlertTriangle className="h-[18px] w-[18px] text-red-500 flex-shrink-0" />
              <div className="flex-1"><p className="text-[13px] font-bold text-red-800">Milestone 2 rejected</p><p className="text-xs text-red-600">Community voted to reject. Revise scope and resubmit evidence.</p></div>
              <Button size="sm" variant="outline" className="border-red-200 text-red-800 h-[30px] px-3 rounded-lg text-xs">View feedback</Button>
            </div>
          </div>
        </SubCard>

        {/* Accordion & Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <SubCard>
            <p className="text-base font-bold mb-1">Accordion / FAQ</p>
            <p className="text-xs text-muted-foreground mb-4">Expandable rows · chevron rotates on open</p>
            <div>
              <div className="border-b border-black/[0.04]">
                <div className="flex items-center justify-between py-4 px-1">
                  <span className="text-sm font-semibold">How does milestone voting work?</span>
                  <ChevronDown className="h-4 w-4 text-amber-500 rotate-180" />
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed px-1 pb-4">
                  When a creator submits evidence for a milestone, backers have 72 hours to vote. Votes are weighted by ownership points — earned proportional to how early you backed.
                </p>
              </div>
              <div className="flex items-center justify-between py-4 px-1 border-b border-black/[0.04]">
                <span className="text-sm font-medium">What happens if a milestone is rejected?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between py-4 px-1">
                <span className="text-sm font-medium">Can I change my vote?</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Dropdown Menu</p>
            <p className="text-xs text-muted-foreground mb-4">Anchored menu · icons + labels · for user menu, more actions</p>
            <div className="bg-[#FAFAFA] rounded-xl p-6 flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-white border border-black/[0.08] rounded-[10px] h-8 px-3 text-[13px] font-medium mb-2">
                Account <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="w-[220px] bg-white rounded-xl border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.14)] p-1.5">
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">K</div>
                  <div><p className="font-semibold text-foreground">E5k4..A9nz</p><p className="text-[10px]">Founders tier</p></div>
                </div>
                <div className="h-px bg-black/[0.04] my-1" />
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-gray-50"><Settings className="h-4 w-4 text-muted-foreground" /> Settings</div>
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg bg-amber-50"><BarChart3 className="h-4 w-4 text-amber-600" /> Dashboard</div>
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-gray-50"><Copy className="h-4 w-4 text-muted-foreground" /> Copy address</div>
                <div className="h-px bg-black/[0.04] my-1" />
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg hover:bg-gray-50 text-red-500"><LogOut className="h-4 w-4" /> Disconnect</div>
              </div>
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 09 DATA DISPLAY ═══ */}
      <S id="data-display" title="09 · Data Display" sub="Stats cards · progress · countdown · activity · tables.">
        {/* Stats */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">Stat Cards</p>
            <span className="text-[11px] text-muted-foreground">number + label + trend</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Wallet, label: "Total backed", value: "12.5 SOL", trend: "+2.1", color: "text-foreground" },
              { icon: TrendingUp, label: "Active", value: "8.2 SOL", trend: null, color: "text-green-600" },
              { icon: Coins, label: "Claimable", value: "4,200", trend: null, color: "text-purple-600" },
              { icon: RotateCcw, label: "Refunds", value: "0", trend: null, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="bg-[#FAFAFA] rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2"><s.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{s.label}</span></div>
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                {s.trend && <p className="text-xs text-green-600">↑ {s.trend} this week</p>}
              </div>
            ))}
          </div>
        </SubCard>

        {/* Progress bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SubCard>
            <p className="text-base font-bold mb-4">Progress</p>
            <Label>Funding — amber, 8px</Label>
            <div className="space-y-1.5 mb-4">
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: "75%" }} /></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>7.5 SOL raised</span><span>10 SOL goal</span></div>
            </div>
            <Label>Vote — purple, 6px</Label>
            <div className="space-y-1.5 mb-4">
              <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: "73%" }} /></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>73% approve</span><span>15 / 23 voted</span></div>
            </div>
            <Label>Milestone — segmented</Label>
            <div className="flex gap-1 h-2">
              <div className="flex-1 bg-green-500 rounded-full" />
              <div className="flex-1 bg-green-500 rounded-full" />
              <div className="flex-1 bg-purple-500 rounded-full" />
              <div className="flex-1 bg-gray-200 rounded-full" />
              <div className="flex-1 bg-gray-200 rounded-full" />
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-4">Countdown Timer</p>
            <Label>Active — purple, large</Label>
            <div className="flex items-center gap-2.5 mb-4">
              {[{ v: "02", l: "days" }, { v: "14", l: "hrs" }, { v: "37", l: "min" }].map((t) => (
                <div key={t.l} className="flex items-center gap-2.5">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600 tabular-nums">{t.v}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t.l}</p>
                  </div>
                  {t.l !== "min" && <span className="text-2xl text-purple-300 font-light">:</span>}
                </div>
              ))}
            </div>
            <Label>Inline compact</Label>
            <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-500/20 rounded-full px-2.5 h-[26px]">
              <Clock className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">2d 14h left</span>
            </div>
          </SubCard>
        </div>

        {/* Table */}
        <SubCard>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">Table / List</p>
            <span className="text-[11px] text-muted-foreground">For backer list, transaction history</span>
          </div>
          <div className="rounded-xl bg-[#FAFAFA] overflow-hidden">
            <div className="flex items-center h-11 px-4 border-b border-black/[0.06] text-xs font-semibold text-muted-foreground">
              <span className="flex-1">Backer</span>
              <span className="w-24 text-right">Amount</span>
              <span className="w-24 text-right">Tier</span>
              <span className="w-20 text-right">Date</span>
            </div>
            {[
              { name: "E5k4..A9nz", amount: "2.00 SOL", tier: "Founders", tierColor: "text-green-600", date: "Apr 7" },
              { name: "7xKm..pQ2f", amount: "1.50 SOL", tier: "Early", tierColor: "text-amber-600", date: "Apr 9" },
              { name: "3fRz..mN8s", amount: "0.50 SOL", tier: "Supporters", tierColor: "text-gray-500", date: "Apr 12" },
            ].map((r) => (
              <div key={r.name} className="flex items-center h-14 px-4 border-b border-black/[0.04] last:border-0">
                <span className="flex-1 font-mono text-sm">{r.name}</span>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{r.amount}</span>
                <span className={`w-24 text-right text-xs font-medium ${r.tierColor}`}>{r.tier}</span>
                <span className="w-20 text-right text-xs text-muted-foreground">{r.date}</span>
              </div>
            ))}
          </div>
        </SubCard>

        {/* Activity Feed */}
        <SubCard className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">Activity Feed</p>
            <span className="text-[11px] text-muted-foreground">timeline with colored dot + actor + action + meta</span>
          </div>
          <div>
            {[
              { dot: "bg-green-500", actor: "E5k4..A9nz", action: "backed with 2.00 SOL", meta: "Founders tier", time: "2 hours ago" },
              { dot: "bg-purple-500", actor: "7xKm..pQ2f", action: "voted Approve on Milestone 1", meta: "15 ownership pts", time: "5 hours ago" },
              { dot: "bg-amber-500", actor: "Creator", action: "submitted evidence for Milestone 1", meta: "3 files attached", time: "1 day ago" },
              { dot: "bg-blue-500", actor: "System", action: "campaign reached 100% funding", meta: "", time: "2 days ago" },
            ].map((a, i) => (
              <div key={i} className={`flex items-start gap-3.5 py-3.5 ${i < 3 ? "border-b border-black/[0.04]" : ""}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${a.dot} mt-1.5 flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm"><span className="font-mono font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span></p>
                  {a.meta && <p className="text-xs text-muted-foreground mt-0.5">{a.meta}</p>}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </SubCard>
      </S>

      {/* ═══ 10 QADAM DOMAIN ═══ */}
      <S id="domain" title="10 · Qadam Domain" sub="Funding card · Campaign card · Vote option · Wallet button · Milestone card · Evidence item · Tx status.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Funding Card */}
          <SubCard>
            <Label>Funding Card</Label>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div><p className="text-2xl font-bold tabular-nums">2.00 SOL</p><p className="text-xs text-muted-foreground">raised of 2.00 SOL goal</p></div>
                <Badge className="bg-green-50 text-green-700 border border-green-200">Funded</Badge>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full w-full" /></div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-[10px] h-9 px-3 text-xs text-green-700">
                <Lock className="h-3 w-3" /> 2.00 SOL in escrow
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 backer</span><span>2 milestones</span><span>25d left</span>
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 gap-2">
                <Wallet className="h-4 w-4" /> Back This Project <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </SubCard>

          {/* Vote Option */}
          <SubCard>
            <Label>Vote Option</Label>
            <p className="text-sm font-bold mb-3">How should this milestone be resolved?</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-green-50 border-2 border-green-500">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-5 w-5 text-white" /></div>
                <div><p className="font-semibold text-green-700">Approve</p><p className="text-xs text-green-600">Release SOL to creator</p></div>
              </div>
              <div className="flex items-center gap-3.5 p-4 rounded-xl border border-black/[0.08]">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><X className="h-5 w-5 text-gray-400" /></div>
                <div><p className="font-semibold">Reject</p><p className="text-xs text-muted-foreground">Request extension or refund</p></div>
              </div>
            </div>
          </SubCard>

          {/* Wallet States */}
          <SubCard>
            <Label>Wallet Button · 3 states</Label>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-1.5">Disconnected</p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2 w-full"><Wallet className="h-4 w-4" /> Connect Wallet</Button>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-1.5">Connecting</p>
                <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#FAFAFA] h-10 px-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 tracking-wide uppercase mb-1.5">Connected</p>
                <div className="flex items-center gap-1.5 bg-[#0F172A] text-white text-xs font-medium rounded-full px-3.5 h-8 w-fit">
                  <div className="w-2 h-2 rounded-full bg-green-400" /> E5k4..A9nz
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            <Label>Transaction Status</Label>
            <div className="space-y-2">
              {[
                { icon: Loader2, color: "text-amber-600", bg: "bg-amber-50", text: "Confirming transaction...", spin: true },
                { icon: Check, color: "text-green-600", bg: "bg-green-50", text: "Transaction confirmed", spin: false },
                { icon: X, color: "text-red-600", bg: "bg-red-50", text: "Transaction failed", spin: false },
              ].map((tx) => (
                <div key={tx.text} className={`flex items-center gap-3 h-[60px] px-3.5 rounded-xl ${tx.bg}`}>
                  <tx.icon className={`h-4 w-4 ${tx.color} ${tx.spin ? "animate-spin" : ""}`} />
                  <span className="text-sm font-medium">{tx.text}</span>
                </div>
              ))}
            </div>
          </SubCard>
        </div>

        {/* Campaign Card */}
        <SubCard className="mt-4 mb-4">
          <Label>Campaign Card — discover listing</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
              <div className="h-[180px] bg-gradient-to-br from-emerald-800 to-teal-900 relative p-3 flex flex-col justify-between">
                <div className="flex justify-between">
                  <Badge className="bg-white/90 text-foreground text-[10px]">Infrastructure</Badge>
                  <Badge className="bg-amber-500 text-white text-[10px]">75% funded</Badge>
                </div>
                <div />
              </div>
              <div className="p-[18px] space-y-3">
                <div>
                  <p className="font-semibold text-[15px]">Qadam Platform Development</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">Trustless crowdfunding infrastructure on Solana with milestone escrow.</p>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: "75%" }} /></div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">1.50 / 2.00 SOL</span>
                  <span>1 backer</span>
                  <span>25d left</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[9px] font-bold">K</div>
                  <span className="text-xs text-muted-foreground">by EpJiBv…fcEo</span>
                </div>
              </div>
            </div>
          </div>
        </SubCard>

        {/* Milestone Card, Evidence, Back Flow, Code Block, Creator Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Milestone Card */}
          <SubCard>
            <Label>Milestone Card · full detail row</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px]">Approved</Badge>
                  <span className="text-sm font-semibold">Milestone 1: Core API</span>
                </div>
                <span className="text-xs text-muted-foreground">12.5 SOL</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">Deploy the public REST API to production. Publish docs and SDK.</p>
              <div className="bg-[#FAFAFA] rounded-[10px] p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Acceptance Criteria</p>
                <p className="text-xs text-muted-foreground">• API responds to /health with 200</p>
                <p className="text-xs text-muted-foreground">• Docs published at docs.qadam.org</p>
                <p className="text-xs text-muted-foreground">• SDK installable via npm</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Deadline: May 15, 2026</span>
                <span className="text-green-600 font-medium">Completed on time</span>
              </div>
            </div>
          </SubCard>

          {/* Evidence Items */}
          <SubCard>
            <Label>Evidence Item · attachments for milestone</Label>
            <p className="text-xs text-muted-foreground mb-3">Creator attaches files, images, links as proof of milestone completion.</p>
            <div className="space-y-2">
              {[
                { icon: Link2, name: "API Documentation", desc: "docs.qadam.org", type: "link" },
                { icon: FileText, name: "deployment-log.txt", desc: "14 KB · Text file", type: "file" },
                { icon: Image, name: "dashboard-screenshot.png", desc: "2.1 MB · Image", type: "image" },
              ].map((ev) => (
                <div key={ev.name} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.06] hover:border-amber-200 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0"><ev.icon className="h-5 w-5 text-amber-600" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{ev.name}</p><p className="text-[11px] text-muted-foreground">{ev.desc}</p></div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </SubCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Back Flow Steps */}
          <SubCard>
            <Label>Back Flow · Step Indicator</Label>
            <p className="text-xs text-muted-foreground mb-3">Used in multi-step Back This Project flow.</p>
            <div className="flex items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-4 w-4 text-white" /></div>
                <span className="text-xs font-medium text-green-700">Amount</span>
              </div>
              <div className="w-14 h-0.5 bg-green-500 mx-1" />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <span className="text-xs font-semibold">Review</span>
              </div>
              <div className="w-14 h-0.5 bg-gray-200 mx-1" />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">3</div>
                <span className="text-xs text-muted-foreground">Confirm</span>
              </div>
            </div>
          </SubCard>

          {/* Code Block & Copy */}
          <SubCard>
            <Label>Code Block & Copy</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg h-7 px-2.5"><code className="text-xs font-mono">E5k4..A9nz</code></div>
                <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Block — multi-line</p>
                <div className="bg-[#0F172A] rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
                  <p>Transaction: 4xK9m...pQ2f</p>
                  <p>Block: 287,391,042</p>
                  <p>Fee: 0.000005 SOL</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-500/20 rounded-full h-7 px-2.5">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-700 font-medium">Copied!</span>
              </div>
            </div>
          </SubCard>

          {/* Creator Strip */}
          <SubCard>
            <Label>Creator Strip · reusable attribution</Label>
            <p className="text-xs text-muted-foreground mb-3">Used on Campaign Detail, Discover cards, Profile pages</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Compact</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">K</div>
                  <div><p className="text-sm font-medium">EpJiBv…fcEo</p><p className="text-[11px] text-muted-foreground">Almaty, Kazakhstan</p></div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Full</p>
                <div className="flex items-center gap-3 bg-[#FAFAFA] rounded-xl p-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">K</div>
                  <div className="flex-1"><p className="text-sm font-semibold">Khakim</p><p className="text-[11px] text-muted-foreground">Creator · Almaty, KZ · 1 campaign</p></div>
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-7">View profile</Button>
                </div>
              </div>
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 11 MOTION & LAYOUT ═══ */}
      <S id="motion" title="11 · Motion & Layout" sub="Transitions · breakpoints · container widths · grid patterns.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SubCard>
            <p className="text-base font-bold mb-1">Transitions</p>
            <p className="text-xs text-muted-foreground mb-4">Gentle, consistent timing across all interactions.</p>
            {[
              { name: "Hover", val: "150ms ease-out", desc: "Buttons, links, cards" },
              { name: "Expand", val: "200ms ease-out", desc: "Accordion, dropdown" },
              { name: "Slide", val: "300ms ease-out", desc: "Modal, sidebar, toast" },
              { name: "Page", val: "500ms ease-out", desc: "Route transitions" },
              { name: "Stagger", val: "100ms per item", desc: "List animations" },
            ].map((t, i) => (
              <div key={t.name} className={`flex items-center gap-3 py-2.5 ${i < 4 ? "border-b border-black/[0.04]" : ""}`}>
                <span className="text-sm font-semibold w-20">{t.name}</span>
                <span className="text-sm font-mono text-amber-600 flex-1">{t.val}</span>
                <span className="text-xs text-muted-foreground">{t.desc}</span>
              </div>
            ))}
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Breakpoints & Containers</p>
            <p className="text-xs text-muted-foreground mb-4">Mobile first. Desktop main focus for Qadam.</p>
            {[
              { name: "sm", val: "640px", desc: "Mobile landscape" },
              { name: "md", val: "768px", desc: "Tablet" },
              { name: "lg", val: "1024px", desc: "Desktop" },
            ].map((bp, i) => (
              <div key={bp.name} className={`flex items-center gap-3 py-2.5 ${i < 2 ? "border-b border-black/[0.04]" : ""}`}>
                <span className="text-sm font-semibold font-mono w-12">{bp.name}</span>
                <span className="text-sm font-mono text-amber-600 flex-1">{bp.val}</span>
                <span className="text-xs text-muted-foreground">{bp.desc}</span>
              </div>
            ))}
            <Separator className="my-3" />
            <Label>Container Widths</Label>
            <div className="space-y-2">
              {[
                { name: "max-w-6xl", val: "1152px", desc: "Primary — campaigns, dashboard, portfolio" },
                { name: "max-w-3xl", val: "768px", desc: "Content — terms, privacy, settings" },
                { name: "max-w-2xl", val: "672px", desc: "Narrow — back flow, success" },
              ].map((cw) => (
                <div key={cw.name} className="flex items-start gap-3">
                  <span className="text-xs font-mono font-semibold w-24 flex-shrink-0">{cw.name}</span>
                  <span className="text-xs text-muted-foreground">{cw.val} — {cw.desc}</span>
                </div>
              ))}
            </div>
          </SubCard>
        </div>
      </S>

      {/* ═══ 12 AI COMPONENTS ═══ */}
      <S id="ai" title="12 · AI Components" sub="Helper panel · suggestions · generation · streaming. Sparkles icon = AI always.">
        {/* AI Attribution badges */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">AI Attribution — badges & pills</p>
            <span className="text-[11px] text-muted-foreground">Always label AI-generated content</span>
          </div>
          <div className="flex flex-wrap gap-2.5 mb-3">
            <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300 gap-1"><Sparkles className="h-3 w-3" /> AI-generated</Badge>
            <Badge className="bg-[#0F172A] text-white gap-1"><Sparkles className="h-3 w-3 text-amber-400" /> Made with AI</Badge>
            <Badge className="bg-white border border-amber-500 text-amber-800 gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> AI Summary</Badge>
            <Badge className="bg-purple-50 border border-purple-300 text-purple-800 gap-1"><Sparkles className="h-3 w-3 text-purple-500" /> AI Helper</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Gradient amber for content attribution · ink pill for creator tools · purple for governance helpers.</p>
        </SubCard>

        {/* AI Input & Action Buttons */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">AI Input & Action Buttons</p>
            <span className="text-[11px] text-muted-foreground">Clearly AI-flavored — never looks like regular input</span>
          </div>
          <Label>AI Prompt Input — sparkles left, amber border on focus, amber send button</Label>
          <div className="flex items-center gap-2.5 h-14 px-4 pr-1.5 rounded-2xl border-[1.5px] border-amber-500 bg-white shadow-[0_0_0_4px_rgba(245,158,11,0.1)] mb-5">
            <Sparkles className="h-[18px] w-[18px] text-amber-500 flex-shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">Ask about this campaign, milestones, creator…</span>
            <span className="text-[11px] text-muted-foreground bg-gray-100 rounded px-2 py-0.5 font-mono">⌘ K</span>
            <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center ml-1"><ArrowRight className="h-[18px] w-[18px] text-white rotate-[-90deg]" /></div>
          </div>
          <Label>AI Action Buttons — sparkles prefix always</Label>
          <div className="flex flex-wrap gap-2.5">
            <Button className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl gap-2 shadow-[0_2px_10px_rgba(245,158,11,0.25)]"><Sparkles className="h-4 w-4" /> Generate cover image</Button>
            <Button variant="outline" className="border-amber-500 border-[1.5px] text-amber-800 rounded-xl gap-2"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> Suggest milestones</Button>
            <Button size="sm" className="bg-amber-100 text-amber-800 rounded-[10px] gap-1.5 h-8"><Sparkles className="h-3 w-3" /> Improve with AI</Button>
          </div>
        </SubCard>

        {/* AI Suggestion Chips */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">AI Suggestion Chips</p>
            <span className="text-[11px] text-muted-foreground">Quick prompts · shown above chat input</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: FileText, text: "Summarize this project" },
              { icon: AlertTriangle, text: "What could go wrong?" },
              { icon: BarChart3, text: "Compare to similar campaigns" },
              { icon: Info, text: "Is this realistic?" },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-1.5 bg-[#FAFAFA] border border-black/[0.08] rounded-full h-[34px] px-3 text-xs font-medium hover:border-amber-200 transition-colors cursor-pointer">
                <s.icon className="h-[13px] w-[13px] text-amber-500" />
                {s.text}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Chips are tappable suggestions. Clicking one sends it as the next user message.</p>
        </SubCard>

        {/* AI Thinking & Streaming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SubCard>
            <p className="text-base font-bold mb-1">AI Thinking States</p>
            <p className="text-xs text-muted-foreground mb-4">Show activity · never leave user guessing</p>
            <Label>Typing Indicator — 3 pulsing dots</Label>
            <div className="flex items-center gap-[5px] bg-[#FAFAFA] border border-black/[0.04] rounded-2xl h-9 px-3.5 w-fit mb-4">
              <div className="w-[7px] h-[7px] rounded-full bg-amber-500 animate-pulse" />
              <div className="w-[7px] h-[7px] rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-[7px] h-[7px] rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <Label>Thinking Label — with spinning sparkle</Label>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full h-8 px-3 mb-4">
              <Sparkles className="h-[13px] w-[13px] text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-xs font-semibold text-amber-800">Thinking…</span>
            </div>
            <Label>Stepped Thinking — shows AI progress</Label>
            <div className="bg-[#FAFAFA] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs"><Check className="h-3.5 w-3.5 text-green-500" /> <span className="text-muted-foreground">Reading project description</span></div>
              <div className="flex items-center gap-2 text-xs"><Check className="h-3.5 w-3.5 text-green-500" /> <span className="text-muted-foreground">Analyzing milestones</span></div>
              <div className="flex items-center gap-2 text-xs"><Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" /> <span className="font-medium">Generating summary…</span></div>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-1">Streaming Text</p>
            <p className="text-xs text-muted-foreground mb-4">Text appearing word-by-word · blinking caret</p>
            <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-2">
              <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 gap-1 text-[10px]"><Sparkles className="h-2.5 w-2.5" /> AI Analysis</Badge>
              <p className="text-[13px] leading-relaxed">
                Nomad is a well-scoped infrastructure project with a credible solo founder based in Kazakhstan. The 4 milestones are logical — backend API before mobile app — and the 50 SOL budget is
                <span className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 animate-pulse align-middle" />
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Generating · 42 tokens/sec</span>
            </div>
          </SubCard>
        </div>

        {/* Chat Bubbles */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">Chat Bubbles</p>
            <span className="text-[11px] text-muted-foreground">User (right, ink) · AI (left, gradient w/ feedback)</span>
          </div>
          <div className="bg-[#FAFAFA] rounded-xl p-5 space-y-3.5">
            {/* User message */}
            <div className="flex items-end gap-2.5 justify-end">
              <div className="bg-[#0F172A] text-white rounded-[16px_16px_4px_16px] px-4 py-3 max-w-[70%]">
                <p className="text-sm">Is this project realistic for 50 SOL?</p>
                <p className="text-[10px] text-white/50 mt-1">12:34 PM</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">K</div>
            </div>
            {/* AI message */}
            <div className="flex items-end gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.25)] flex-shrink-0"><Sparkles className="h-4 w-4 text-white" /></div>
              <div className="max-w-[70%]">
                <div className="bg-white border border-black/[0.06] rounded-[16px_16px_16px_4px] px-4 py-3 shadow-sm">
                  <p className="text-sm leading-relaxed">Based on comparable Solana projects, 50 SOL is reasonable for the scope. The risk is timeline — 3 months for 4 milestones is aggressive for a solo dev.</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 ml-1">
                  <button className="text-[10px] text-muted-foreground hover:text-foreground">👍</button>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground">👎</button>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"><Copy className="h-2.5 w-2.5" /> Copy</button>
                </div>
              </div>
            </div>
          </div>
        </SubCard>

        {/* AI Image Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SubCard>
            <p className="text-base font-bold mb-4">AI Image Generation</p>
            <Label>Generating — shimmer + progress pill</Label>
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl h-[180px] gap-3">
              <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center"><Sparkles className="h-6 w-6 text-amber-600 animate-spin" style={{ animationDuration: "3s" }} /></div>
              <p className="text-[13px] font-semibold text-amber-900">Generating cover image…</p>
              <div className="w-[220px] h-[5px] bg-white/50 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: "60%" }} /></div>
              <p className="text-[10px] text-amber-700">~8 seconds remaining</p>
            </div>
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-4">AI Image — generated preview</p>
            <Label>Done — preview with regen + accept</Label>
            <div className="bg-amber-100 rounded-xl h-[180px] relative p-3 flex flex-col justify-between">
              <Badge className="bg-[#0F172A] text-white gap-1 w-fit text-[10px]"><Sparkles className="h-2.5 w-2.5 text-amber-400" /> AI Generated</Badge>
              <div className="flex gap-2 self-end">
                <Button size="sm" variant="outline" className="rounded-lg gap-1 text-xs bg-white/90 h-8"><RotateCcw className="h-3 w-3" /> Regenerate</Button>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg gap-1 text-xs h-8"><Check className="h-3 w-3" /> Use this image</Button>
              </div>
            </div>
          </SubCard>
        </div>

        {/* AI Error & Low Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SubCard>
            <p className="text-base font-bold mb-4">AI Error & Low-Confidence States</p>
            <Label>Error — AI failed to respond</Label>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-4">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><AlertCircle className="h-4 w-4 text-red-500" /></div>
              <div className="flex-1"><p className="text-[13px] font-semibold text-red-800">AI unavailable</p><p className="text-xs text-red-600">Could not generate a response. Try again.</p></div>
              <Button size="sm" variant="outline" className="border-red-200 text-red-700 gap-1 h-[30px] text-xs rounded-lg"><RotateCcw className="h-3 w-3" /> Retry</Button>
            </div>
            <Label>Low Confidence — uncertainty warning</Label>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <Info className="h-[18px] w-[18px] text-amber-500 flex-shrink-0" />
              <div><p className="text-[13px] font-semibold text-amber-800">Low confidence</p><p className="text-xs text-amber-700">AI is not confident about this assessment. Consider manual review.</p></div>
            </div>
          </SubCard>

          {/* AI Helper Card inline */}
          <SubCard>
            <p className="text-base font-bold mb-4">AI Helper Card · inline suggestion</p>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold text-amber-900">AI Suggestion</span></div>
                <button><X className="h-4 w-4 text-amber-400" /></button>
              </div>
              <p className="text-[13px] text-amber-900 leading-relaxed">Current phrasing is vague. A more specific, testable title helps backers evaluate progress.</p>
              <div className="bg-white/70 rounded-[10px] p-3 space-y-1 font-mono text-xs">
                <p className="text-red-500 line-through">Build the app</p>
                <p className="text-green-600">Deploy public REST API with docs and SDK on Devnet</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="rounded-lg text-xs h-8">Dismiss</Button>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs h-8 gap-1"><Check className="h-3 w-3" /> Apply</Button>
              </div>
            </div>
          </SubCard>
        </div>

        {/* AI Helper Panel — full layout */}
        <SubCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">AI Helper Panel · full layout</p>
            <span className="text-[11px] text-muted-foreground">Sidebar · appears on campaign detail · 400px wide</span>
          </div>
          <div className="bg-[#FAFAFA] rounded-2xl p-6 flex justify-end h-[480px]">
            <div className="w-full max-w-[400px] bg-white rounded-2xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-[18px] py-4 border-b border-black/[0.04]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.25)]"><Sparkles className="h-4 w-4 text-white" /></div>
                <div className="flex-1"><p className="text-sm font-semibold">Qadam AI</p><p className="text-[10px] text-muted-foreground">Campaign assistant</p></div>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              {/* Body */}
              <div className="flex-1 p-[18px] space-y-3 overflow-auto">
                <div className="flex flex-wrap gap-1.5">
                  {["Summarize", "Risks?", "Similar projects"].map((c) => (
                    <div key={c} className="flex items-center gap-1 bg-[#FAFAFA] border border-black/[0.06] rounded-full h-7 px-2.5 text-[11px] font-medium cursor-pointer hover:border-amber-200">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" /> {c}
                    </div>
                  ))}
                </div>
                {/* AI response */}
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0"><Sparkles className="h-3 w-3 text-white" /></div>
                  <div className="bg-[#FAFAFA] border border-black/[0.04] rounded-[12px_12px_12px_4px] px-3 py-2">
                    <p className="text-xs leading-relaxed">This is a well-structured project with clear milestones. The 2 SOL goal is achievable given the team size.</p>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-3.5 py-3 border-t border-black/[0.04]">
                <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-amber-500 bg-white">
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground flex-1">Ask about this campaign…</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center"><Send className="h-3.5 w-3.5 text-white" /></div>
                </div>
              </div>
            </div>
          </div>
        </SubCard>

        {/* AI Milestone Suggestions */}
        <SubCard>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold">AI Milestone Suggestions</p>
            <span className="text-[11px] text-muted-foreground">Used in Create Wizard · creator accepts/modifies/rejects each</span>
          </div>
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-3.5 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-[13px] font-medium text-amber-800 flex-1">AI generated 4 milestones based on your project description. Review, edit, or replace any.</p>
            <Button size="sm" variant="ghost" className="text-amber-800 gap-1 text-xs h-[30px]"><RotateCcw className="h-3 w-3" /> Regenerate all</Button>
          </div>
          <div className="space-y-2.5">
            {[
              { n: 1, title: "Core API on Devnet", desc: "Core REST endpoints live on devnet with basic auth. Readable docs published.", accepted: false },
              { n: 2, title: "Mobile App MVP", desc: "iOS app with core flows: sign-in, balance view, send SOL. TestFlight build available.", accepted: true },
            ].map((ms) => (
              <div key={ms.n} className="flex items-start gap-3 p-3.5 rounded-xl border border-black/[0.08]">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 text-[13px] font-bold flex-shrink-0">{ms.n}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{ms.title}</p>
                    <span className="text-xs text-muted-foreground">12.5 SOL</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ms.desc}</p>
                  {ms.accepted && <Badge className="bg-green-50 text-green-700 text-[10px] mt-1.5 gap-0.5"><Check className="h-2.5 w-2.5" /> Accepted</Badge>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="w-[30px] h-[30px] rounded-lg bg-[#FAFAFA] flex items-center justify-center"><PenLine className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="w-[30px] h-[30px] rounded-lg bg-[#FAFAFA] flex items-center justify-center"><RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="w-[30px] h-[30px] rounded-lg bg-[#FAFAFA] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="rounded-[10px] gap-1.5 text-[13px]"><Plus className="h-3.5 w-3.5" /> Add manually</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-[10px] gap-1.5 text-[13px]"><Check className="h-3.5 w-3.5" /> Accept all milestones</Button>
          </div>
        </SubCard>
      </S>

      {/* ═══ 13 WRITING & VOICE ═══ */}
      <S id="writing" title="13 · Writing & Voice" sub="Tone, button copy, empty states, AI disclosure. Principles that keep Qadam sounding like itself.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SubCard>
            <p className="text-base font-bold mb-4">Voice Principles</p>
            {[
              { p: "Direct, not clever", d: "Say what it does. Skip the wordplay." },
              { p: "Honest, not salesy", d: "No 'revolutionary'. No 'game-changing'. Just facts." },
              { p: "Warm, not corporate", d: "We are humans building for humans." },
              { p: "Specific, not vague", d: "'49 Founders spots left' beats 'Limited availability'." },
              { p: "Calm, not urgent", d: "No fake urgency. Real deadlines speak for themselves." },
            ].map((v, i) => (
              <div key={v.p} className={`py-3 ${i < 4 ? "border-b border-black/[0.04]" : ""}`}>
                <p className="text-sm font-semibold">{v.p}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{v.d}</p>
              </div>
            ))}
          </SubCard>
          <SubCard>
            <p className="text-base font-bold mb-4">Do & Don&apos;t</p>
            {[
              { do_: "\"Back This Project\"", dont: "\"Invest Now for Massive Returns\"", why: "Action, not hype" },
              { do_: "\"Your SOL goes to escrow\"", dont: "\"Revolutionary funding mechanism\"", why: "Concrete, not abstract" },
              { do_: "\"49 Founders spots left\"", dont: "\"Limited time offer!!!\"", why: "Real scarcity, not fake" },
            ].map((ex, i) => (
              <div key={ex.do_} className={`py-3 space-y-2 ${i < 2 ? "border-b border-black/[0.04]" : ""}`}>
                <div className="flex items-start gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-sm">{ex.do_}</span></div>
                <div className="flex items-start gap-2"><X className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" /><span className="text-sm text-muted-foreground line-through">{ex.dont}</span></div>
                <p className="text-xs text-muted-foreground pl-6">{ex.why}</p>
              </div>
            ))}
          </SubCard>
        </div>
      </S>

      {/* ═══ 14 IN CONTEXT ═══ */}
      <S id="in-context" title="14 · In Context" sub="Tokens + components = consistent surfaces across every screen.">
        <SubCard>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 space-y-5">
              <Badge className="bg-amber-100 text-amber-700">Community Governed</Badge>
              <h3 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">Build step by step.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Community-governed crowdfunding on Solana. SOL stays in escrow
                until backers approve each milestone. Early backers earn ownership points.
              </p>
              <div className="flex items-center gap-2.5">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2"><ArrowRight className="h-4 w-4" /> Start a Campaign</Button>
                <Button variant="outline" className="rounded-full gap-2">Explore</Button>
              </div>
            </div>
            <div className="w-full md:w-[360px] flex-shrink-0 bg-[#FAFAFA] rounded-2xl p-5 space-y-3.5">
              <p className="text-sm font-bold">What you get as a backer</p>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-500">
                <Crown className="h-5 w-5 text-green-600" />
                <div><p className="text-sm font-semibold text-green-700">Founders tier — 1.0 pts/SOL</p><p className="text-xs text-green-600">First 50 backers</p></div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50">
                <Shield className="h-5 w-5 text-amber-600" />
                <div><p className="text-sm font-semibold">Escrow protection</p><p className="text-xs text-muted-foreground">SOL locked until milestones pass</p></div>
              </div>
            </div>
          </div>
        </SubCard>
      </S>

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-xs text-muted-foreground">Qadam Design System v2 · April 2026</p>
        <p className="text-xs text-muted-foreground mt-1">Open this page to see all live components. Edit tokens in globals.css.</p>
      </div>
    </div>
  );
}
