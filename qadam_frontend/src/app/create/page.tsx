"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_MILESTONES } from "@/lib/constants";
import {
  Plus, Trash2, Loader2, ArrowRight, ArrowLeft,
  Image, Eye, Check, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { AiHelperButton } from "@/components/ai-helper/ai-helper-button";
import { TierConfigurator, type TierConfigItem } from "@/components/wizard/tier-configurator";
import { SOLANA_NETWORK } from "@/lib/constants";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);
import { VotingParamsConfigurator, type VotingParams } from "@/components/wizard/voting-params-configurator";

interface MilestoneInput {
  title: string;
  description: string;
  acceptance_criteria: string;
  amount: string;
  deadline: string;
}

// Step descriptions are embedded in STEPS array

const STEPS = [
  { num: 1, title: "Idea", sub: "Name, pitch, goal" },
  { num: 2, title: "Story", sub: "Problem, solution, risks" },
  { num: 3, title: "Team", sub: "Your team" },
  { num: 4, title: "Plan", sub: "Milestones and criteria" },
  { num: 5, title: "Preview", sub: "Review and launch" },
];

const CATEGORIES = [
  "Tech", "Hardware", "Software", "Art & Design", "Music",
  "Film", "Education", "Community", "Research", "Climate",
];

const ACCENT_COLORS = [
  { id: "forest", label: "Forest", color: "#1F4731" },
  { id: "mint", label: "Mint", color: "#94B79E" },
  { id: "bronze", label: "Bronze", color: "#A07A3F" },
  { id: "violet", label: "Violet", color: "#8B5BCB" },
  { id: "slate", label: "Slate", color: "#46546C" },
  { id: "ink", label: "Ink", color: "#1A2A22" },
];

export default function CreateCampaignPage() {
  const { connected, publicKey } = useWallet();
  const { createCampaign: createCampaignTx } = useQadamProgram();
  const router = useRouter();
  // Profile setup removed from /create gate — creators can fill profile in /settings anytime

  const [step, setStep] = useState(1);
  const [maxStepVisited, setMaxStepVisited] = useState(1);
  const [loading, setLoading] = useState(false);

  // Track highest step visited for sidebar navigation
  const goToStep = (s: number) => {
    setStep(s);
    setMaxStepVisited((prev) => Math.max(prev, s));
  };

  // Step 1 — Idea
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [category, setCategory] = useState("Tech");
  const [goal, setGoal] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState("forest");

  // Step 2 — Story (Foundation v1: split fields)
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [background, setBackground] = useState("");
  const [risks, setRisks] = useState("");

  // Step 3 — Team
  const [teamMembers, setTeamMembers] = useState<{ name: string; role: string; social_link: string }[]>([]);

  // Step 4 — Plan
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", acceptance_criteria: "", amount: "", deadline: "" },
  ]);
  const [fundingDeadline, setFundingDeadline] = useState("");
  const [tierConfig, setTierConfig] = useState<TierConfigItem[]>([
    { name: "Founders", multiplier: 1.0, max_spots: 50 },
    { name: "Early Backers", multiplier: 0.7, max_spots: 200 },
    { name: "Supporters", multiplier: 0.5, max_spots: null },
  ]);
  const [votingParams, setVotingParams] = useState<VotingParams>({
    vote_period_days: 7,
    quorum_pct: 0.2,
    approval_threshold_pct: 0.5,
  });
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);

  // Keep old description for backwards compat in draft restore
  const [description, setDescription] = useState("");

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
        if (d.problem) setProblem(d.problem);
        if (d.solution) setSolution(d.solution);
        if (d.whyNow) setWhyNow(d.whyNow);
        if (d.background) setBackground(d.background);
        if (d.risks) setRisks(d.risks);
        if (d.teamMembers) setTeamMembers(d.teamMembers);
        if (d.faqItems) setFaqItems(d.faqItems);
        if (d.milestones?.length) setMilestones(d.milestones);
        if (d.fundingDeadline) setFundingDeadline(d.fundingDeadline);
        if (d.tierConfig?.length) setTierConfig(d.tierConfig);
        if (d.accentColor) setAccentColor(d.accentColor);
        if (d.votingParams) setVotingParams(d.votingParams);
        if (d.step) { setStep(d.step); setMaxStepVisited(d.maxStepVisited || d.step); }
        if (d.title) {
          toast.info("Draft restored", { description: "Your previous progress has been loaded.", duration: 4000 });
        }
      }
    } catch { /* ignore corrupt draft */ }
  }, []);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (title || description || problem || milestones[0]?.title) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title, pitch, category, goal, description, pitchVideoUrl,
          problem, solution, whyNow, background, risks, teamMembers,
          faqItems, milestones, fundingDeadline, step, maxStepVisited,
          tierConfig, votingParams, accentColor,
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

  // Full description for backwards compat (combines story fields)
  const fullDescription = [problem, solution, whyNow, background, description].filter(Boolean).join("\n\n");

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

  // Check if step has meaningful content filled
  const isStepFilled = (s: number): boolean => {
    switch (s) {
      case 1: return !!title && !!goal;
      case 2: return !!problem || !!solution;
      case 3: return true; // team is optional, always "done"
      case 4: return milestones.some(m => !!m.title && !!m.amount);
      case 5: return true;
      default: return false;
    }
  };

  // Validation per step (5 steps now)
  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1: return !!title && !!goal && goalNum >= 0.5;
      case 2: return true; // story fields optional but encouraged
      case 3: return true; // team is optional
      case 4: return amountsMatch && milestones.every(m => !!m.title && !!m.amount && !!m.deadline);
      case 5: return true;
      default: return false;
    }
  };

  // Launch
  const handleLaunch = async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const nonce = Date.now();
      // Convert tier_config to Anchor format (multiplierBps + maxSpots)
      const anchorTiers = tierConfig.map((t) => ({
        multiplierBps: Math.round(t.multiplier * 10000),
        maxSpots: t.max_spots === null ? 0 : t.max_spots, // 0 = unlimited on-chain
      }));

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
        tierConfigs: anchorTiers,
        votePeriodDays: votingParams.vote_period_days,
        quorumBps: Math.round(votingParams.quorum_pct * 10000),
        approvalThresholdBps: Math.round(votingParams.approval_threshold_pct * 10000),
      });

      try {
        const { syncCampaignCreation, uploadCoverImage, uploadGalleryImage } = await import("@/lib/api");
        const SOL = LAMPORTS_PER_SOL;

        let coverUrl: string | undefined;
        if (coverFile) {
          try {
            const uploaded = await uploadCoverImage(coverFile);
            coverUrl = uploaded.url;
          } catch { /* cover upload is optional */ }
        }

        // Gallery upload — sequential to keep order
        const galleryUrls: string[] = [];
        if (galleryFiles.length > 0) {
          for (const file of galleryFiles) {
            try {
              const uploaded = await uploadGalleryImage(file);
              galleryUrls.push(uploaded.url);
            } catch { /* continue with what uploaded */ }
          }
        }

        const syncResult = await syncCampaignCreation({
          solana_pubkey: result.campaignPda,
          creator_wallet: publicKey.toBase58(),
          title,
          pitch: pitch || undefined,
          description: fullDescription,
          category,
          cover_image_url: coverUrl,
          pitch_video_url: pitchVideoUrl || undefined,
          goal_lamports: Math.floor(goalNum * SOL),
          milestones_count: milestones.length,
          tokens_per_lamport: tokensPerSol || 100,
          // Foundation v1 fields
          problem: problem || undefined,
          solution: solution || undefined,
          why_now: whyNow || undefined,
          background: background || undefined,
          risks: risks || undefined,
          team_members: teamMembers.length > 0 ? teamMembers : undefined,
          faq: faqItems.length > 0 ? faqItems : undefined,
          accent_color: accentColor !== "forest" ? accentColor : undefined,
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : undefined,
          funding_deadline: fundingDeadline ? new Date(fundingDeadline).toISOString() : undefined,
          tier_config: tierConfig,
          vote_period_days: votingParams.vote_period_days,
          quorum_pct: votingParams.quorum_pct,
          approval_threshold_pct: votingParams.approval_threshold_pct,
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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Rocket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-display text-3xl tracking-tight mb-2">Create a Campaign</h1>
        <p className="text-muted-foreground mb-6">Connect your wallet to get started.</p>
        <WalletMultiButton
          style={{
            backgroundColor: "var(--foreground)",
            height: "48px",
            borderRadius: "9999px",
            fontSize: "15px",
            padding: "0 32px",
            lineHeight: "48px",
            width: "100%",
            justifyContent: "center",
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8 animate-page-enter">
      <div className="grid grid-cols-1 md:grid-cols-[248px_1fr] gap-12 items-start">
        {/* Sidebar — step navigation */}
        <div className="hidden md:block w-[248px] flex-shrink-0">
          <div className="sticky top-[88px]">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.18em] mb-4 pl-1">Create Campaign</p>
            <nav className="space-y-1">
              {STEPS.map((s) => {
                const isActive = step === s.num;
                const isFilled = isStepFilled(s.num) && !isActive;
                return (
                  <button
                    key={s.num}
                    onClick={() => goToStep(s.num)}
                    className={`w-full grid grid-cols-[36px_1fr] items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all duration-150 cursor-pointer ${
                      isActive ? "bg-amber-50" : "hover:bg-foreground/[0.03]"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0 ${
                      isActive ? "bg-amber-500 text-primary-foreground" :
                      isFilled ? "bg-amber-100 text-amber-500" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {isFilled ? <Check className="h-3.5 w-3.5" /> : s.num}
                    </div>
                    <div>
                      <p className={`text-[14.5px] font-semibold whitespace-nowrap ${isActive ? "text-amber-500" : "text-foreground"}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5 whitespace-nowrap">{s.sub}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Draft status card */}
            <div className="mt-7 p-4 bg-card border border-border rounded-[14px]">
              <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">Draft</p>
              <p className="text-[13px] text-foreground/70 leading-snug">Auto-saved. You can leave and come back.</p>
              <button
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  window.location.reload();
                }}
                className="mt-3 w-full py-2 bg-transparent border border-border rounded-lg text-xs text-foreground/60 hover:text-foreground/80 hover:border-foreground/20 transition-colors cursor-pointer"
              >
                Discard draft
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
        {/* Mobile step indicator */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <button
                onClick={() => goToStep(s.num)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold cursor-pointer ${
                  step === s.num ? "bg-amber-500 text-primary-foreground" : isStepFilled(s.num) ? "bg-amber-100 text-amber-500" : "bg-secondary text-muted-foreground"
                }`}
              >
                {isStepFilled(s.num) && s.num !== step ? <Check className="h-3 w-3" /> : s.num}
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${isStepFilled(s.num) ? "bg-amber-200" : "bg-foreground/10"}`} />}
            </div>
          ))}
        </div>

      {/* Step content */}
      <div className="space-y-6">

        {/* ═══ STEP 1: IDEA ═══ */}
        {step === 1 && (
          <>
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold text-amber-500 uppercase tracking-[0.16em] mb-2">Step 1 of 5</p>
              <h2 className="font-display text-4xl md:text-[52px] md:leading-[1.02] tracking-tight">Tell us about your <em className="text-amber-500">project</em></h2>
              <p className="text-foreground/70 mt-3 text-base max-w-[640px]">This is what backers will see first. Make it count.</p>
            </div>

            <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="space-y-5">
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">Project name</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. "Nomad — Banking for Remote Workers"'
                    maxLength={100}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card"
                  />
                </div>

                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">One-line pitch</label>
                  <Input
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="What is it, in one sentence?"
                    maxLength={200}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card"
                  />
                  <p className="text-[12.5px] text-muted-foreground mt-1.5">If a friend asks what you&apos;re building — this is what you say.</p>
                </div>

                <AiHelperButton
                  context="title"
                  onApply={(text) => {
                    const lines = text.split("\n").filter(Boolean);
                    if (lines[0] && !title) setTitle(lines[0].replace(/^[\d.)\-*]+\s*/, "").replace(/"/g, ""));
                  }}
                />

                {/* Cover image */}
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">Cover image</label>
                  {coverPreview ? (
                    <div className="relative rounded-[14px] overflow-hidden h-40 mb-2">
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setCoverFile(null); setCoverPreview(""); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/45 text-white flex items-center justify-center text-xs hover:bg-black/60"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2.5 py-9 px-6 border-2 border-dashed border-border rounded-[14px] bg-secondary/60 cursor-pointer hover:border-amber-400 hover:bg-card transition-all">
                      <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                        <Image className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-foreground/70">Click to upload <span className="font-normal text-muted-foreground">or drag & drop</span></span>
                      <span className="text-xs font-mono text-muted-foreground">PNG, JPG · up to 5 MB · 1600×900 recommended</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverFile(file);
                            setCoverPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[12.5px] text-muted-foreground mt-1.5">Optional. Shows on Discover and campaign page.</p>
                </div>

                {/* Gallery — additional screenshots */}
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">
                    Gallery <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional, up to 5)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {galleryPreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-gradient-to-br from-amber-400/30 to-amber-500/30">
                        <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setGalleryFiles(galleryFiles.filter((_, j) => j !== i));
                            setGalleryPreviews(galleryPreviews.filter((_, j) => j !== i));
                          }}
                          className="absolute top-1.5 right-1.5 w-[22px] h-[22px] rounded-full bg-black/45 text-white flex items-center justify-center text-[11px] hover:bg-black/60 z-10"
                        >
                          ×
                        </button>
                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.1em] text-white/85 bg-black/30 rounded-full px-2.5 py-0.5 z-10 whitespace-nowrap">SHOT {String(i + 1).padStart(2, "0")}</span>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - galleryPreviews.length) }).map((_, i) => (
                      <label key={`empty-${i}`} className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-secondary/60 cursor-pointer hover:border-amber-400 transition-colors">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && galleryFiles.length < 5) {
                              setGalleryFiles([...galleryFiles, file]);
                              setGalleryPreviews([...galleryPreviews, URL.createObjectURL(file)]);
                            }
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-[12.5px] text-muted-foreground mt-1.5">Screenshots, mockups, or photos of your project.</p>
                </div>

                {/* Pitch video URL */}
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">
                    Pitch video <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional)</span>
                  </label>
                  <Input
                    value={pitchVideoUrl}
                    onChange={(e) => setPitchVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/... or https://loom.com/..."
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card font-mono text-sm"
                  />
                  <p className="text-[12.5px] text-muted-foreground mt-1.5">YouTube or Loom link. Embedded on your campaign page.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[14.5px] font-semibold mb-2 block">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/60 px-3.5 py-3 text-[14.5px] outline-none focus:border-amber-500 focus:bg-card transition-colors appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6F66' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "36px" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[14.5px] font-semibold mb-2 block">Funding goal (SOL)</label>
                    <Input
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="10"
                      min={0.5}
                      step={0.5}
                      className="rounded-xl bg-secondary/60 border-border focus:bg-card font-mono text-sm"
                    />
                    <p className="text-[12.5px] text-muted-foreground mt-1.5">How much do you really need? Include buffer.</p>
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">
                    Campaign accent <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setAccentColor(c.id)}
                        className={`w-9 h-9 rounded-full transition-transform cursor-pointer relative hover:scale-110 ${accentColor === c.id ? "border-2 border-foreground" : "border-2 border-transparent"}`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      >
                        {accentColor === c.id && <span className="absolute -inset-1.5 border-[1.5px] border-foreground rounded-full" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12.5px] text-muted-foreground mt-1.5">Applies to your campaign&apos;s CTA button and progress bar.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ STEP 2: STORY (Foundation v1 — split fields) ═══ */}
        {step === 2 && (
          <>
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold text-amber-500 uppercase tracking-[0.16em] mb-2">Step 2 of 5</p>
              <h2 className="font-display text-4xl md:text-[52px] md:leading-[1.02] tracking-tight">Tell the <em className="text-amber-500">story</em></h2>
              <p className="text-foreground/70 mt-3 text-base max-w-[640px]">Backers invest in stories, not forms. Structure helps them understand.</p>
            </div>

            <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] space-y-5">
                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">The Problem</label>
                  <Textarea
                    value={problem}
                    onChange={(e) => setProblem((e.target as HTMLTextAreaElement).value)}
                    placeholder="What's broken in the world that this project fixes? For whom? How serious?"
                    rows={3}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                  />
                  <AiHelperButton context="problem" onApply={(t) => setProblem(t)} className="mt-2" />
                </div>

                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">The Solution</label>
                  <Textarea
                    value={solution}
                    onChange={(e) => setSolution((e.target as HTMLTextAreaElement).value)}
                    placeholder="How does this project solve the problem?"
                    rows={3}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                  />
                  <AiHelperButton context="solution" onApply={(t) => setSolution(t)} className="mt-2" />
                </div>

                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">Why now</label>
                  <Textarea
                    value={whyNow}
                    onChange={(e) => setWhyNow((e.target as HTMLTextAreaElement).value)}
                    placeholder="What changed in the world (technology, market, regulation) that makes this the right time?"
                    rows={3}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                  />
                </div>

                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">Background <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional)</span></label>
                  <Textarea
                    value={background}
                    onChange={(e) => setBackground((e.target as HTMLTextAreaElement).value)}
                    placeholder="The personal story behind this — how you arrived at this idea."
                    rows={2}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                  />
                </div>

                <div>
                  <label className="text-[14.5px] font-semibold mb-2 block">Risks & challenges</label>
                  <Textarea
                    value={risks}
                    onChange={(e) => setRisks((e.target as HTMLTextAreaElement).value)}
                    placeholder="What could go wrong? Be uncomfortable. Backers respect honesty more than confidence."
                    rows={3}
                    className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[120px]"
                  />
                  <p className="text-[12.5px] text-foreground/60 mt-1.5">This shows verbatim on your campaign page. Plain language. No marketing.</p>
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold mb-1">FAQ <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional)</span></h3>
                  <p className="text-[13.5px] text-muted-foreground">Common questions backers might ask. Helps build trust.</p>
                </div>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 bg-secondary border border-border rounded-full text-[13.5px] font-medium text-foreground/70 hover:bg-amber-50 hover:text-amber-500 transition-colors whitespace-nowrap cursor-pointer"
                  onClick={() => setFaqItems([...faqItems, { q: "", a: "" }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add question
                </button>
              </div>
              {faqItems.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {faqItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-[24px_1fr_32px] gap-2.5 items-center bg-secondary/60 border border-border rounded-xl p-3.5">
                      <span className="font-mono text-[11px] text-muted-foreground font-bold">{String(i + 1).padStart(2, "0")}</span>
                      <div className="space-y-2">
                        <Input
                          value={item.q}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[i] = { ...updated[i], q: e.target.value };
                            setFaqItems(updated);
                          }}
                          placeholder="Question"
                          className="text-sm font-semibold rounded-lg bg-card border-border"
                        />
                        <Textarea
                          value={item.a}
                          onChange={(e) => {
                            const updated = [...faqItems];
                            updated[i] = { ...updated[i], a: (e.target as HTMLTextAreaElement).value };
                            setFaqItems(updated);
                          }}
                          placeholder="Answer"
                          rows={2}
                          className="text-[13px] rounded-lg bg-card border-border"
                        />
                      </div>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => setFaqItems(faqItems.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ STEP 3: TEAM ═══ */}
        {step === 3 && (
          <>
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold text-amber-500 uppercase tracking-[0.16em] mb-2">Step 3 of 5</p>
              <h2 className="font-display text-4xl md:text-[52px] md:leading-[1.02] tracking-tight">Who&apos;s <em className="text-amber-500">building</em> this?</h2>
              <p className="text-foreground/70 mt-3 text-base max-w-[640px]">Your profile is auto-loaded. Add team members if you have a team.</p>
            </div>

            <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] space-y-5">
                {/* Creator profile preview */}
                <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 p-[18px_20px] bg-amber-50 border border-border rounded-2xl">
                  <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-primary-foreground font-mono text-sm font-bold">
                    {(publicKey?.toBase58() || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold">You (Creator)</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{publicKey?.toBase58().slice(0, 8)} ... {publicKey?.toBase58().slice(-4)}</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground whitespace-nowrap">
                    <Check className="h-3 w-3" /> Auto-loaded
                  </span>
                </div>

                {/* Team members */}
                <div>
                  <label className="text-[14.5px] font-semibold mb-3 block">Team members <span className="font-normal text-muted-foreground text-[13.5px] ml-1">(optional)</span></label>

                  {/* Saved members as cards */}
                  {teamMembers.filter(m => m.name).map((member, idx) => (
                    <div key={idx} className="bg-secondary/60 border border-border rounded-2xl p-[18px_20px] mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] text-muted-foreground font-semibold uppercase tracking-[0.04em]">Member {idx + 1}</span>
                        <button
                          onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <Input value={member.name} readOnly className="text-sm rounded-lg bg-card border-border font-semibold" />
                        <Input value={member.role || "Team member"} readOnly className="text-sm rounded-lg bg-card border-border" />
                      </div>
                      {member.social_link && (
                        <Input value={member.social_link} readOnly className="text-sm rounded-lg bg-card border-border font-mono" />
                      )}
                    </div>
                  ))}

                  {/* Add new member form */}
                  {teamMembers.length < 10 && (() => {
                    const emptyIdx = teamMembers.findIndex(m => !m.name);
                    if (emptyIdx >= 0) {
                      const member = teamMembers[emptyIdx];
                      return (
                        <div className="bg-secondary/60 border border-border rounded-2xl p-[18px_20px] mb-3">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-muted-foreground font-semibold uppercase tracking-[0.04em]">New member</span>
                            <button
                              onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== emptyIdx))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={member.name}
                              onChange={(e) => { const u = [...teamMembers]; u[emptyIdx] = { ...u[emptyIdx], name: (e.target as HTMLInputElement).value }; setTeamMembers(u); }}
                              placeholder="Name"
                              className="text-sm rounded-lg bg-card border-border"
                              autoFocus
                            />
                            <Input
                              value={member.role}
                              onChange={(e) => { const u = [...teamMembers]; u[emptyIdx] = { ...u[emptyIdx], role: (e.target as HTMLInputElement).value }; setTeamMembers(u); }}
                              placeholder="Role (e.g. Design Lead)"
                              className="text-sm rounded-lg bg-card border-border"
                            />
                          </div>
                          <Input
                            value={member.social_link}
                            onChange={(e) => { const u = [...teamMembers]; u[emptyIdx] = { ...u[emptyIdx], social_link: (e.target as HTMLInputElement).value }; setTeamMembers(u); }}
                            placeholder="Social link (optional)"
                            className="text-sm rounded-lg bg-card border-border mt-3"
                          />
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => setTeamMembers([...teamMembers, { name: "", role: "", social_link: "" }])}
                        className="flex items-center gap-2 px-[18px] py-[11px] bg-secondary border border-border rounded-full text-sm font-medium text-foreground/70 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-500/25 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add team member
                      </button>
                    );
                  })()}
                </div>
            </div>
          </>
        )}

        {/* ═══ STEP 4: PLAN ═══ */}
        {step === 4 && (
          <>
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold text-amber-500 uppercase tracking-[0.16em] mb-2">Step 4 of 5</p>
              <h2 className="font-display text-4xl md:text-[52px] md:leading-[1.02] tracking-tight">Break down your <em className="text-amber-500">path</em></h2>
              <p className="text-foreground/70 mt-3 text-base max-w-[640px]">
                Your goal: <strong className="text-foreground font-bold">{goalNum} SOL</strong>. Split into 1-5 milestones. Each unlocks part of funding when approved.
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

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div key={idx} className="bg-card border border-border rounded-[18px] p-[22px_24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
                        <span className="w-[22px] h-[22px] rounded-full bg-amber-500 text-primary-foreground flex items-center justify-center text-[11px] font-bold tracking-normal">{idx + 1}</span>
                        Milestone {idx + 1}
                      </span>
                      {milestones.length > 1 && (
                        <button onClick={() => removeMilestone(idx)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[14.5px] font-semibold mb-2 block">Title</label>
                        <Input
                          value={m.title}
                          onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                          placeholder="e.g. MVP Launch"
                          className="rounded-xl bg-secondary/60 border-border focus:bg-card"
                        />
                      </div>

                      <div>
                        <label className="text-[14.5px] font-semibold mb-2 block">What will you deliver?</label>
                        <Textarea
                          value={m.description}
                          onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                          placeholder="Describe the outcome..."
                          rows={2}
                          className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                        />
                      </div>

                      <div>
                        <label className="text-[14.5px] font-semibold mb-2 block">How will backers verify?</label>
                        <Textarea
                          value={m.acceptance_criteria}
                          onChange={(e) => updateMilestone(idx, "acceptance_criteria", e.target.value)}
                          placeholder="e.g. Live demo at URL, screenshots of analytics, 50 test users"
                          rows={2}
                          className="rounded-xl bg-secondary/60 border-border focus:bg-card min-h-[96px]"
                        />
                        <p className="text-[12.5px] text-muted-foreground mt-1.5">Be specific. Community votes based on these criteria.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[14.5px] font-semibold mb-2 block">Amount (SOL)</label>
                          <Input
                            type="number"
                            value={m.amount}
                            onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                            placeholder="4"
                            min={0.1}
                            step={0.1}
                            className="rounded-xl bg-secondary/60 border-border focus:bg-card font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[14.5px] font-semibold mb-2 block">Deadline</label>
                          <Input
                            type="date"
                            value={m.deadline}
                            onChange={(e) => updateMilestone(idx, "deadline", e.target.value)}
                            className="rounded-xl bg-secondary/60 border-border focus:bg-card font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                </div>
              ))}

              {milestones.length < MAX_MILESTONES && (
                <button
                  onClick={addMilestone}
                  className="w-full py-3.5 bg-secondary/60 border-[1.5px] border-dashed border-border rounded-[14px] text-sm font-semibold text-foreground/70 flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-500 hover:bg-card transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Milestone ({milestones.length}/{MAX_MILESTONES})
                </button>
              )}

              {/* Sum check — totals table */}
              <div className="bg-secondary/60 border border-border rounded-2xl overflow-hidden my-4">
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between items-center px-5 py-3.5 text-sm border-b border-foreground/[0.04]">
                    <span className="text-foreground/70">Milestone {i + 1}{m.title ? ` · ${m.title}` : ""}</span>
                    <span className="font-mono font-semibold text-sm whitespace-nowrap">{(parseFloat(m.amount) || 0).toFixed(2)} SOL</span>
                  </div>
                ))}
                <div className={`flex justify-between items-center px-5 py-3.5 text-sm font-bold bg-card ${amountsMatch ? "text-amber-500" : goalNum > 0 ? "text-[var(--terracotta)]" : "text-foreground"}`}>
                  <span>Total</span>
                  <span className="font-mono text-[15px] whitespace-nowrap">
                    {totalMilestoneAmount} / {goalNum} SOL {amountsMatch ? " ✓" : ""}
                  </span>
                </div>
              </div>

              {/* Tier configurator */}
              <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <h3 className="text-[17px] font-bold mb-1">Tier structure</h3>
                <p className="text-[13.5px] text-muted-foreground mb-5">The earlier a backer joins, the larger their share. Configure how that scales.</p>
                <TierConfigurator value={tierConfig} onChange={setTierConfig} goalSol={goalNum} />
              </div>

              {/* Voting params */}
              <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <h3 className="text-[17px] font-bold mb-1">Voting rules</h3>
                <p className="text-[13.5px] text-muted-foreground mb-5">These lock at launch. Backers vote with these rules on every milestone.</p>
                <VotingParamsConfigurator value={votingParams} onChange={setVotingParams} />
              </div>

              {/* Funding deadline */}
              <div className="bg-card border border-border rounded-[22px] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <h3 className="text-[17px] font-bold mb-3">Funding deadline</h3>
                <Input
                  type="date"
                  value={fundingDeadline}
                  onChange={(e) => setFundingDeadline((e.target as HTMLInputElement).value)}
                  className="rounded-xl bg-secondary/60 border-border focus:bg-card font-mono text-sm max-w-[280px]"
                />
                {(() => {
                  const firstDeadline = milestones[0]?.deadline;
                  const invalid = fundingDeadline && firstDeadline && new Date(fundingDeadline) >= new Date(firstDeadline);
                  return invalid
                    ? <p className="text-xs text-destructive mt-2">Must be before first milestone deadline ({new Date(firstDeadline).toLocaleDateString()})</p>
                    : <p className="text-[12.5px] text-muted-foreground mt-2">When backing window closes.</p>;
                })()}
              </div>
            </div>
          </>
        )}

        {/* ═══ STEP 5: PREVIEW ═══ */}
        {step === 5 && (
          <>
            <div className="mb-8">
              <p className="font-mono text-[11px] font-bold text-amber-500 uppercase tracking-[0.16em] mb-2">Step 5 of 5</p>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h2 className="font-display text-4xl md:text-[52px] md:leading-[1.02] tracking-tight">Preview your <em className="text-amber-500">campaign</em></h2>
                  <p className="text-foreground/70 mt-3 text-base max-w-[640px]">This is exactly what backers will see. Launch when ready.</p>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border rounded-full text-[13px] font-medium text-foreground/70 hover:bg-secondary transition-colors whitespace-nowrap cursor-pointer">
                  <Eye className="h-3.5 w-3.5" /> Open full preview
                </button>
              </div>
            </div>

            {/* Preview card — hero + body split */}
            <div className="mt-6">
              {/* Cover hero */}
              {coverPreview ? (
                <div className="h-[260px] rounded-t-[22px] overflow-hidden relative">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover object-bottom" />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(800px 200px at 50% 100%, rgba(255,255,255,0.4), transparent 60%)" }} />
                </div>
              ) : (
                <div className="h-[260px] rounded-t-[22px] bg-gradient-to-br from-[#c8d4cb] to-[#B8C7BB] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(800px 200px at 50% 100%, rgba(255,255,255,0.4), transparent 60%)" }} />
                  <Image className="h-14 w-14 text-foreground/20" />
                </div>
              )}

              {/* Body */}
              <div className="bg-card border border-border border-t-0 rounded-b-[22px] p-[26px_30px] space-y-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-secondary border border-border text-xs font-semibold">{category}</span>
                  <button onClick={() => goToStep(1)} className="text-amber-500 text-[13px] font-semibold flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap">Edit <ArrowRight className="h-2.5 w-2.5" /></button>
                </div>
                <h2 className="font-display text-[32px] font-semibold tracking-tight mb-5">{title || "Untitled Campaign"}</h2>

                {/* Milestones preview group */}
                <div className="py-[18px] border-t border-border">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <h3 className="text-[15px] font-bold">Milestones ({milestones.length})</h3>
                    <button onClick={() => goToStep(4)} className="text-amber-500 text-[13px] font-semibold flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap">Edit <ArrowRight className="h-2.5 w-2.5" /></button>
                  </div>
                  <div className="space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="bg-secondary/60 border border-border rounded-xl px-4 py-3 flex justify-between items-center text-sm">
                        <span>Milestone {i + 1}{m.title ? ` · ${m.title}` : ""}</span>
                        <span className="font-mono font-semibold whitespace-nowrap">{parseFloat(m.amount) || 0} SOL</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financials */}
                <div className="py-[18px] border-t border-border space-y-0">
                  <div className="flex justify-between py-2.5 text-sm border-b border-foreground/[0.04]">
                    <span className="text-foreground/70">Goal</span>
                    <span className="font-mono font-bold">{goalNum} SOL</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm border-b border-foreground/[0.04]">
                    <span className="text-foreground/70">Platform fee</span>
                    <span className="font-mono font-bold">2.5% per release</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-foreground/70">Security deposit</span>
                    <span className="font-mono font-bold">{securityDeposit.toFixed(3)} SOL <span className="font-sans font-normal text-muted-foreground">(refundable)</span></span>
                  </div>
                </div>

                {/* Tier config preview */}
                <div className="py-[18px] border-t border-border">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <h3 className="text-[15px] font-bold">Tier structure</h3>
                    <button onClick={() => goToStep(4)} className="text-amber-500 text-[13px] font-semibold flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap">Edit <ArrowRight className="h-2.5 w-2.5" /></button>
                  </div>
                  <div className="space-y-2">
                    {tierConfig.map((t, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{t.name} — <strong>{Math.round(t.multiplier * 100)}%</strong></span>
                        <span className="font-mono text-muted-foreground">{t.max_spots ? `${t.max_spots} spots` : "Unlimited"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voting params preview */}
                <div className="py-[18px] border-t border-border">
                  <div className="flex items-baseline justify-between mb-3.5">
                    <h3 className="text-[15px] font-bold">Voting rules</h3>
                    <button onClick={() => goToStep(4)} className="text-amber-500 text-[13px] font-semibold flex items-center gap-1 hover:underline cursor-pointer whitespace-nowrap">Edit <ArrowRight className="h-2.5 w-2.5" /></button>
                  </div>
                  <div className="flex gap-6 flex-wrap text-sm text-foreground/70">
                    <span className="whitespace-nowrap">Period: <strong className="font-mono">{votingParams.vote_period_days}d</strong></span>
                    <span className="whitespace-nowrap">Quorum: <strong className="font-mono">{Math.round(votingParams.quorum_pct * 100)}%</strong></span>
                    <span className="whitespace-nowrap">Threshold: <strong className="font-mono">{Math.round(votingParams.approval_threshold_pct * 100)}%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-launch checklist */}
            <div className="bg-card border border-border rounded-[22px] p-[24px_30px] mt-[18px]">
              <h3 className="text-[15px] font-bold mb-4">Launch readiness</h3>
              <div className="space-y-0">
                {[
                  { done: !!coverPreview, label: "Cover image uploaded", step: 1 },
                  { done: !!problem && !!solution, label: "Story complete (problem + solution)", step: 2 },
                  { done: milestones.length >= 2, label: `${milestones.length} milestone${milestones.length !== 1 ? "s" : ""} defined`, step: 4 },
                  { done: amountsMatch, label: "Milestone amounts match goal", step: 4 },
                  { done: teamMembers.length > 0, label: "Team added", step: 3, optional: true },
                  { done: faqItems.length > 0, label: `${faqItems.length} FAQ question${faqItems.length !== 1 ? "s" : ""}`, step: 2, optional: true },
                  { done: galleryPreviews.length > 0, label: `${galleryPreviews.length} gallery image${galleryPreviews.length !== 1 ? "s" : ""}`, step: 1, optional: true },
                  { done: !!pitchVideoUrl, label: "Pitch video added", step: 1, optional: true },
                  { done: !!fundingDeadline, label: "Funding deadline set", step: 4 },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5 text-sm border-b border-foreground/[0.04] last:border-b-0">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? "bg-amber-500" : item.optional ? "bg-secondary" : "bg-[var(--terracotta)]"}`}>
                      {item.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <span className="font-medium">
                      {item.label}
                      {item.optional && !item.done && <span className="text-muted-foreground font-normal text-[13px] ml-1">(optional)</span>}
                    </span>
                    {item.done ? (
                      <span className="text-amber-500 text-[13px] font-semibold whitespace-nowrap">Done</span>
                    ) : (
                      <button onClick={() => goToStep(item.step)} className="text-amber-500 text-[13px] font-semibold hover:underline cursor-pointer whitespace-nowrap">
                        {item.optional ? "Add" : "Fix"} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Launch info */}
            <div className="bg-secondary rounded-[18px] p-[22px_28px] mt-[18px]">
              <h3 className="text-sm font-bold mb-3">When you launch</h3>
              <div className="space-y-1">
                <p className="flex items-start gap-2.5 text-[13.5px] text-foreground/70 py-1"><span className="text-amber-500 font-bold text-lg leading-none mt-[-2px]">·</span>Campaign goes live on Solana immediately</p>
                <p className="flex items-start gap-2.5 text-[13.5px] text-foreground/70 py-1"><span className="text-amber-500 font-bold text-lg leading-none mt-[-2px]">·</span>Security deposit ({securityDeposit.toFixed(3)} SOL) is taken from your wallet</p>
                <p className="flex items-start gap-2.5 text-[13.5px] text-foreground/70 py-1"><span className="text-amber-500 font-bold text-lg leading-none mt-[-2px]">·</span>Milestones, tiers, and voting rules cannot be changed after launch</p>
                <p className="flex items-start gap-2.5 text-[13.5px] text-foreground/70 py-1"><span className="text-amber-500 font-bold text-lg leading-none mt-[-2px]">·</span>2.5% platform fee per milestone release</p>
              </div>
              {SOLANA_NETWORK === "devnet" && (
                <p className="mt-3.5 pt-3.5 border-t border-border text-[13px] font-bold text-amber-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Devnet — campaign will deploy to devnet, not mainnet
                </p>
              )}
            </div>
          </>
        )}

        {/* Navigation — step footer */}
        <div className="flex items-center justify-between pt-6 mt-2 border-t border-border">
          {step > 1 ? (
            <button
              onClick={() => goToStep(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-foreground/70 hover:bg-foreground/[0.04] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <span className="text-[13px] text-muted-foreground">Draft saved</span>
          )}

          {step < 5 ? (
            <div className="flex items-center gap-3.5">
              {step === 4 && amountsMatch && (
                <span className="text-[13px] text-amber-500 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                  <Check className="h-3.5 w-3.5" /> Milestone amounts match goal
                </span>
              )}
              {!canProceed(step) && (
                <span className="text-[13px] text-muted-foreground">
                  {step === 1 && (!title ? "Add a title" : !goal || goalNum < 0.5 ? "Set a goal (min 0.5 SOL)" : "")}
                  {step === 4 && (!amountsMatch ? "Milestone amounts must equal goal" : "Fill in all milestone fields")}
                </span>
              )}
              <button
                onClick={() => canProceed(step) && goToStep(step + 1)}
                disabled={!canProceed(step)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  canProceed(step) ? "bg-amber-500 hover:bg-amber-600 text-primary-foreground" : "bg-amber-500/35 text-primary-foreground/60 cursor-not-allowed pointer-events-none"
                }`}
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleLaunch}
                disabled={loading || !canProceed(4)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold transition-all cursor-pointer ${
                  loading || !canProceed(4) ? "bg-amber-500/35 text-primary-foreground/60 cursor-not-allowed" : "bg-gradient-to-br from-amber-400 to-amber-500 text-primary-foreground hover:from-amber-500 hover:to-amber-600"
                }`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Launch on Solana
              </button>
              <p className="text-[12.5px] text-muted-foreground text-right">
                Your wallet will ask you to confirm. This cannot be undone.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
