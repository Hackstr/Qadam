"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MAX_MILESTONES, MIN_BACKING_SOL, formatSol } from "@/lib/constants";
import {
  Plus, Trash2, Loader2, ArrowRight, ArrowLeft,
  Lightbulb, Image, Target, Eye, Check, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { AiHelperButton } from "@/components/ai-helper/ai-helper-button";

interface MilestoneInput {
  title: string;
  description: string;
  acceptance_criteria: string;
  amount: string;
  deadline: string;
}

const STEPS = [
  { num: 1, title: "Idea", icon: Lightbulb },
  { num: 2, title: "Story", icon: Image },
  { num: 3, title: "Plan", icon: Target },
  { num: 4, title: "Preview", icon: Eye },
];

export default function CreateCampaignPage() {
  const { connected, publicKey } = useWallet();
  const { createCampaign: createCampaignTx } = useQadamProgram();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Idea
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [category, setCategory] = useState("Apps");
  const [goal, setGoal] = useState("");

  // Step 2 — Story
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [risks, setRisks] = useState("");
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);

  // Step 3 — Plan
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", acceptance_criteria: "", amount: "", deadline: "" },
  ]);

  // Draft save/restore
  const DRAFT_KEY = "qadam_campaign_draft";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.pitch) setPitch(d.pitch);
        if (d.category) setCategory(d.category);
        if (d.goal) setGoal(d.goal);
        if (d.description) setDescription(d.description);
        if (d.pitchVideoUrl) setPitchVideoUrl(d.pitchVideoUrl);
        if (d.risks) setRisks(d.risks);
        if (d.faqItems) setFaqItems(d.faqItems);
        if (d.milestones?.length) setMilestones(d.milestones);
        if (d.step) setStep(d.step);
      }
    } catch { /* ignore corrupt draft */ }
  }, []);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (title || description || milestones[0]?.title) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title, pitch, category, goal, description, pitchVideoUrl, risks, faqItems, milestones, step,
        }));
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [title, pitch, category, goal, description, pitchVideoUrl, risks, faqItems, milestones, step]);

  // Computed
  const goalNum = parseFloat(goal) || 0;
  const totalMilestoneAmount = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const amountsMatch = goalNum > 0 && Math.abs(totalMilestoneAmount - goalNum) < 0.001;
  const AUTO_SUPPLY = 1_000_000;
  const tokensPerSol = goalNum > 0 ? Math.floor(AUTO_SUPPLY / goalNum) : 100;
  const securityDeposit = goalNum * 0.005;

  // Full description combines pitch + description + risks
  const fullDescription = [pitch, description].filter(Boolean).join("\n\n");

  // Milestone helpers
  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    setMilestones([...milestones, { title: "", description: "", acceptance_criteria: "", amount: "", deadline: "" }]);
  };
  const removeMilestone = (idx: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== idx));
  };
  const updateMilestone = (idx: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };
    setMilestones(updated);
  };

  // Validation per step
  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1: return !!title && !!goal && goalNum >= 0.5;
      case 2: return true; // story is optional
      case 3: return amountsMatch && milestones.every(m => !!m.title && !!m.amount && !!m.deadline);
      case 4: return true;
      default: return false;
    }
  };

  // Launch
  const handleLaunch = async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const nonce = Date.now();
      const result = await createCampaignTx({
        title,
        nonce,
        milestonesCount: milestones.length,
        goalSol: goalNum,
        tokensPerLamport: tokensPerSol || 100,
        milestones: milestones.map((m) => ({
          amountSol: parseFloat(m.amount) || 0,
          deadline: new Date(m.deadline),
        })),
      });

      try {
        const { syncCampaignCreation, uploadCoverImage } = await import("@/lib/api");
        const SOL = LAMPORTS_PER_SOL;

        let coverUrl: string | undefined;
        if (coverFile) {
          try {
            const uploaded = await uploadCoverImage(coverFile);
            coverUrl = uploaded.url;
          } catch { /* cover upload is optional, campaign still created */ }
        }

        const syncResult = await syncCampaignCreation({
          solana_pubkey: result.campaignPda,
          creator_wallet: publicKey.toBase58(),
          title,
          description: fullDescription,
          category,
          cover_image_url: coverUrl,
          pitch_video_url: pitchVideoUrl || undefined,
          goal_lamports: Math.floor(goalNum * SOL),
          milestones_count: milestones.length,
          tokens_per_lamport: tokensPerSol || 100,
          milestones: milestones.map((m, idx) => ({
            index: idx,
            title: m.title,
            description: m.description,
            acceptance_criteria: m.acceptance_criteria,
            amount_lamports: Math.floor((parseFloat(m.amount) || 0) * SOL),
            deadline: new Date(m.deadline).toISOString(),
            grace_deadline: new Date(new Date(m.deadline).getTime() + 7 * 86400000).toISOString(),
          })),
        });

        localStorage.removeItem(DRAFT_KEY);

        const campaignId = syncResult?.data?.id;
        if (campaignId) {
          router.push(`/create/success?id=${campaignId}`);
        } else {
          router.push("/dashboard?created=true");
        }
        return;
      } catch (e) { console.warn("Sync failed:", e); }

      localStorage.removeItem(DRAFT_KEY);
      router.push("/dashboard?created=true");
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      console.error("Creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Create a Campaign</h1>
        <p className="text-muted-foreground">Connect your wallet to get started.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex gap-10">
        {/* Sidebar — step navigation */}
        <div className="hidden md:block w-52 flex-shrink-0">
          <p className="text-sm font-semibold text-muted-foreground mb-4">Create Campaign</p>
          <nav className="space-y-1">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              const labels = ["Name, pitch, goal", "Cover, description, risks", "Milestones and criteria", "Review and launch"];
              return (
                <button
                  key={s.num}
                  onClick={() => isDone && setStep(s.num)}
                  disabled={!isDone && !isActive}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive ? "bg-amber-50 border border-amber-200" :
                    isDone ? "hover:bg-gray-50 cursor-pointer" :
                    "opacity-40"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isActive ? "bg-amber-500 text-white" :
                    isDone ? "bg-green-500 text-white" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? "text-amber-700" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.num}. {s.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{labels[s.num - 1]}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
        {/* Mobile step indicator */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s.num ? "bg-amber-500 text-white" : step > s.num ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {step > s.num ? <Check className="h-3 w-3" /> : s.num}
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${step > s.num ? "bg-green-300" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

      {/* Step content */}
      <div className="space-y-6">

        {/* ═══ STEP 1: IDEA ═══ */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Step 1 of 4</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tell us about your project</h2>
              <p className="text-muted-foreground mt-2">This is what backers will see first. Make it count.</p>
            </div>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project name</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. "Nomad — Banking for Remote Workers"'
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">One-line pitch</label>
                  <Input
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="What is it, in one sentence?"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">If a friend asks what you're building — this is what you say.</p>
                </div>

                <AiHelperButton
                  context="title"
                  onApply={(text) => {
                    const lines = text.split("\n").filter(Boolean);
                    if (lines[0] && !title) setTitle(lines[0].replace(/^[\d.)\-*]+\s*/, "").replace(/"/g, ""));
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {["Apps", "Games", "SaaS", "Tools", "Infrastructure"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Funding goal (SOL)</label>
                    <Input
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="10"
                      min={0.5}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">How much do you really need? Include buffer.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ═══ STEP 2: STORY ═══ */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Step 2 of 4</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Make them feel it</h2>
              <p className="text-muted-foreground mt-2">Backers invest in stories, not in forms. Show them what you're building.</p>
            </div>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cover image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5_000_000) {
                        toast.error("Image must be under 5MB");
                        return;
                      }
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }}
                    className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {coverPreview && (
                    <img src={coverPreview} alt="Cover" className="mt-2 h-40 w-full object-cover rounded-lg border" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">1200 x 630 recommended. Max 5MB.</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Pitch video (optional)</label>
                  <Input
                    value={pitchVideoUrl}
                    onChange={(e) => setPitchVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/... or https://loom.com/..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">About this project</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What problem do you solve? Why now? Who benefits? What makes it different?"
                    rows={6}
                  />
                  <AiHelperButton
                    context="description"
                    onApply={(text) => setDescription(text)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Risks & Challenges</label>
                  <Textarea
                    value={risks}
                    onChange={(e) => setRisks(e.target.value)}
                    placeholder="Be honest. Backers respect transparency more than perfection."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">What could go wrong? How will you handle it?</p>
                </div>

                {/* FAQ */}
                <div>
                  <label className="text-sm font-medium mb-2 block">FAQ (optional)</label>
                  <p className="text-xs text-muted-foreground mb-3">Common questions backers might ask. Shows as a tab on your campaign page.</p>
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Q{idx + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))} className="h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                      <Input
                        value={item.q}
                        onChange={(e) => { const u = [...faqItems]; u[idx] = { ...u[idx], q: e.target.value }; setFaqItems(u); }}
                        placeholder="Question"
                        className="text-sm"
                      />
                      <Input
                        value={item.a}
                        onChange={(e) => { const u = [...faqItems]; u[idx] = { ...u[idx], a: e.target.value }; setFaqItems(u); }}
                        placeholder="Answer"
                        className="text-sm"
                      />
                    </div>
                  ))}
                  {faqItems.length < 5 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setFaqItems([...faqItems, { q: "", a: "" }])} className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add FAQ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ═══ STEP 3: PLAN ═══ */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Step 3 of 4</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Break down your path</h2>
              <p className="text-muted-foreground mt-1">
                Your goal: <strong>{goalNum} SOL</strong>. Split into 1-5 milestones. Each unlocks part of funding when approved.
              </p>
            </div>

            <AiHelperButton
              context="milestones"
              placeholder="Describe your project and its main phases..."
              onApply={(text) => {
                // Try to parse AI response into milestone fields
                const lines = text.split("\n").filter(l => l.trim());
                const parsed: MilestoneInput[] = [];
                let current: Partial<MilestoneInput> = {};
                for (const line of lines) {
                  const titleMatch = line.match(/^(?:\d+[\.\)]\s*|[-•]\s*)?(?:Milestone\s*\d*:?\s*)?(.{5,60})$/i);
                  if (titleMatch && !current.title) {
                    current.title = titleMatch[1].trim().replace(/^["']|["']$/g, "");
                  } else if (current.title && !current.description) {
                    current.description = line.trim();
                    current.acceptance_criteria = "";
                    current.amount = "";
                    current.deadline = "";
                    parsed.push(current as MilestoneInput);
                    current = {};
                  }
                }
                if (parsed.length > 0) {
                  setMilestones(parsed.slice(0, MAX_MILESTONES));
                  toast.success(`${parsed.length} milestone(s) generated — edit amounts and deadlines below`);
                } else {
                  toast.success("Review the suggestions and edit your milestones below");
                }
              }}
            />

            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <Card key={idx}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Milestone {idx + 1}</h4>
                      {milestones.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeMilestone(idx)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block text-muted-foreground">Title</label>
                      <Input
                        value={m.title}
                        onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                        placeholder="e.g. MVP Launch"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block text-muted-foreground">What will you deliver?</label>
                      <Textarea
                        value={m.description}
                        onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                        placeholder="Describe the outcome..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block text-muted-foreground">How will backers verify?</label>
                      <Textarea
                        value={m.acceptance_criteria}
                        onChange={(e) => updateMilestone(idx, "acceptance_criteria", e.target.value)}
                        placeholder="e.g. Live demo at URL, screenshots of analytics, 50 test users"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Be specific. Community votes based on these criteria.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Amount (SOL)</label>
                        <Input
                          type="number"
                          value={m.amount}
                          onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                          placeholder="4"
                          min={0.1}
                          step={0.1}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Deadline</label>
                        <Input
                          type="date"
                          value={m.deadline}
                          onChange={(e) => updateMilestone(idx, "deadline", e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {milestones.length < MAX_MILESTONES && (
                <Button variant="outline" className="w-full gap-2" onClick={addMilestone}>
                  <Plus className="h-4 w-4" /> Add Milestone ({milestones.length}/{MAX_MILESTONES})
                </Button>
              )}

              {/* Sum check */}
              <div className={`p-3 rounded-lg border text-sm ${amountsMatch ? "bg-green-50 border-green-200 text-green-700" : goalNum > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-muted/30 border-black/[0.06] text-muted-foreground"}`}>
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between">
                    <span>Milestone {i + 1}</span>
                    <span className="tabular-nums">{parseFloat(m.amount) || 0} SOL</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {totalMilestoneAmount} / {goalNum} SOL {amountsMatch ? "✓" : goalNum > 0 ? "— must match" : ""}
                  </span>
                </div>
              </div>

              {/* Security deposit */}
              {goalNum > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  <span className="mt-0.5 flex-shrink-0">i</span>
                  <span>Security deposit: {securityDeposit.toFixed(3)} SOL (0.5% of goal). Returned progressively as milestones are approved.</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ STEP 4: PREVIEW ═══ */}
        {step === 4 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Step 4 of 4</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Preview your campaign</h2>
                <p className="text-muted-foreground mt-2">This is exactly what backers will see. Launch when ready.</p>
              </div>
              <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Preview</Badge>
            </div>

            {/* Preview card */}
            <Card className="overflow-hidden">
              {/* Cover */}
              {coverPreview ? (
                <div className="h-48 overflow-hidden">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover object-bottom" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <Image className="h-10 w-10 text-gray-400" />
                </div>
              )}

              <CardContent className="p-5 space-y-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{category}</Badge>
                  <h3 className="text-xl font-bold">{title || "Untitled Campaign"}</h3>
                  {pitch && <p className="text-muted-foreground mt-1">{pitch}</p>}
                </div>

                {fullDescription && (
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{fullDescription}</p>
                  </div>
                )}

                {risks && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 mb-1">Risks & Challenges</p>
                    <p className="text-xs text-muted-foreground">{risks}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Milestones ({milestones.length})</p>
                  <div className="space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm">{m.title || `Milestone ${i + 1}`}</p>
                          <span className="text-sm tabular-nums text-muted-foreground">{parseFloat(m.amount) || 0} SOL</span>
                        </div>
                        {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                        {m.acceptance_criteria && (
                          <div className="mt-2 p-2 bg-amber-50/50 border border-amber-100/50 rounded text-xs">
                            <span className="font-medium text-amber-700">Acceptance criteria: </span>
                            <span className="text-muted-foreground">{m.acceptance_criteria}</span>
                          </div>
                        )}
                        {m.deadline && (
                          <p className="text-xs text-muted-foreground mt-1">Deadline: {new Date(m.deadline).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-semibold">{goalNum} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>2.5% per release</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Security deposit</span>
                  <span>{securityDeposit.toFixed(3)} SOL (refundable)</span>
                </div>
              </CardContent>
            </Card>

            {/* Launch */}
            <div className="p-4 border border-black/[0.06] rounded-xl space-y-3">
              <p className="text-sm font-medium">When you launch:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Campaign goes live on Solana</li>
                <li>Security deposit ({securityDeposit.toFixed(3)} SOL) is taken from your wallet</li>
                <li>Milestones cannot be changed after launch</li>
                <li>2.5% platform fee per milestone release</li>
              </ul>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleLaunch}
              disabled={loading || !canProceed(3)}
              className="gap-2 bg-[#0F1724] hover:bg-[#1a2538] text-white"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Launch on Solana
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
