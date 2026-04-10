"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_MILESTONES, MIN_BACKING_SOL } from "@/lib/constants";
import { Plus, Trash2, Loader2, ArrowRight } from "lucide-react";

interface MilestoneInput {
  title: string;
  description: string;
  acceptance_criteria: string;
  amount: string;
  deadline: string;
}

export default function CreateCampaignPage() {
  const { connected, publicKey, createCampaign: createCampaignTx, txStatus } = useQadamProgram();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Apps");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("1000000");
  const [backerPercent, setBackerPercent] = useState("20");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", acceptance_criteria: "", amount: "", deadline: "" },
  ]);

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

  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0), 0
  );
  const goalNum = parseFloat(goal) || 0;
  const amountsMatch = Math.abs(totalMilestoneAmount - goalNum) < 0.001;

  // Calculate token rate from supply/percent/goal
  const supplyNum = parseInt(totalSupply) || 0;
  const percentNum = parseInt(backerPercent) || 0;
  const backerTokens = Math.floor(supplyNum * percentNum / 100);
  const tokensPerSol = goalNum > 0 ? Math.floor(backerTokens / goalNum) : 0;
  const securityDeposit = goalNum * 0.005;

  const handleCreate = async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const nonce = Date.now(); // Unique nonce per campaign
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
      console.log("Campaign on-chain:", result);

      // Sync to PostgreSQL so it appears in Discover
      try {
        const { syncCampaignCreation, uploadCoverImage } = await import("@/lib/api");
        const SOL = 1_000_000_000;

        let coverUrl: string | undefined;
        if (coverFile) {
          try {
            const uploaded = await uploadCoverImage(coverFile);
            coverUrl = uploaded.url;
          } catch { /* cover upload is optional */ }
        }

        await syncCampaignCreation({
          solana_pubkey: result.campaignPda,
          creator_wallet: publicKey!.toBase58(),
          title,
          description,
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
      } catch (e) { console.warn("Sync failed:", e); }

      router.push("/dashboard?created=true");
    } catch (err: any) {
      if (err?.message === "cancelled") return; // User rejected — toast already shown
      console.error("Creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Create Campaign</h1>
      <p className="text-muted-foreground mb-6">
        Define your project, set milestones, and start receiving funding.
      </p>

      {/* How it works — onboarding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto text-sm font-bold mb-2">1</div>
          <p className="text-xs font-medium">Describe your project</p>
          <p className="text-xs text-muted-foreground mt-0.5">Title, description, cover image</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto text-sm font-bold mb-2">2</div>
          <p className="text-xs font-medium">Define milestones</p>
          <p className="text-xs text-muted-foreground mt-0.5">Clear goals with deadlines and criteria</p>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto text-sm font-bold mb-2">3</div>
          <p className="text-xs font-medium">Launch on-chain</p>
          <p className="text-xs text-muted-foreground mt-0.5">Campaign goes live on Solana</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Project"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building and why?"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cover Image (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5_000_000) {
                    import("sonner").then(({ toast }) => toast.error("Image must be under 5MB"));
                    return;
                  }
                  setCoverFile(file);
                  setCoverPreview(URL.createObjectURL(file));
                }}
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-700 hover:file:bg-amber-100"
              />
              {coverPreview && (
                <img src={coverPreview} alt="Cover preview" className="mt-2 h-32 w-full object-cover rounded-lg border" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Pitch Video URL (optional)</label>
              <Input
                value={pitchVideoUrl}
                onChange={(e) => setPitchVideoUrl(e.target.value)}
                placeholder="https://youtube.com/... or https://loom.com/..."
              />
            </div>
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
                <label className="text-sm font-medium mb-1 block">Funding Goal (SOL)</label>
                <Input
                  type="number"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="10"
                  min={MIN_BACKING_SOL}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Milestones ({milestones.length}/{MAX_MILESTONES})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addMilestone}
              disabled={milestones.length >= MAX_MILESTONES}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Milestone {idx + 1}</h4>
                  {milestones.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeMilestone(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <Input
                  value={m.title}
                  onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                  placeholder="Milestone title"
                />
                <Textarea
                  value={m.description}
                  onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                  placeholder="What will you deliver in this milestone?"
                  rows={2}
                />
                <Textarea
                  value={m.acceptance_criteria}
                  onChange={(e) => updateMilestone(idx, "acceptance_criteria", e.target.value)}
                  placeholder="Acceptance criteria: e.g. 'Working demo at URL, 100+ test users, screenshot of analytics'"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground -mt-2">AI will evaluate evidence against these criteria.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    value={m.amount}
                    onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                    placeholder="Amount (SOL)"
                  />
                  <Input
                    type="date"
                    value={m.deadline}
                    onChange={(e) => updateMilestone(idx, "deadline", e.target.value)}
                  />
                </div>
              </div>
            ))}

            {goalNum > 0 && (
              <div className={`text-sm ${amountsMatch ? "text-green-600" : "text-red-500"}`}>
                Milestone total: {totalMilestoneAmount} SOL / Goal: {goalNum} SOL
                {amountsMatch ? " ✓" : " — must match!"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token config */}
        <Card>
          <CardHeader>
            <CardTitle>Project Token</CardTitle>
            <p className="text-sm text-muted-foreground">
              Backers receive your project tokens as co-owners. You control the name, supply, and allocation.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Token Name</label>
                <Input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. MyApp Token"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Symbol</label>
                <Input
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. MYAPP"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Total Supply</label>
                <Input
                  type="number"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  placeholder="1,000,000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">% for Backers</label>
                <Input
                  type="number"
                  value={backerPercent}
                  onChange={(e) => setBackerPercent(e.target.value)}
                  placeholder="20"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            {/* Auto-calculated preview */}
            {goalNum > 0 && tokensPerSol > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-1.5">
                <p className="font-medium mb-2">Token Distribution Preview</p>
                <p>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2" />
                  Genesis Tier: <strong>{tokensPerSol.toLocaleString()} {tokenSymbol || "TOKEN"}/SOL</strong> (1.0x)
                </p>
                <p>
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  Early Tier: <strong>{Math.floor(tokensPerSol * 0.67).toLocaleString()} {tokenSymbol || "TOKEN"}/SOL</strong> (0.67x)
                </p>
                <p>
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2" />
                  Standard: <strong>{Math.floor(tokensPerSol * 0.5).toLocaleString()} {tokenSymbol || "TOKEN"}/SOL</strong> (0.5x)
                </p>
                <p className="text-muted-foreground pt-2 border-t mt-2">
                  Total for backers: {backerTokens.toLocaleString()} {tokenSymbol || "TOKEN"} ({backerPercent}% of {supplyNum.toLocaleString()})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security deposit warning */}
        {goalNum > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <span className="text-amber-500 mt-0.5">&#9432;</span>
            <div>
              <p className="font-medium text-amber-800">Security Deposit: {securityDeposit.toFixed(4)} SOL</p>
              <p className="text-amber-700">0.5% of your goal. Returned progressively as milestones are approved.</p>
            </div>
          </div>
        )}

        {/* Submit */}
        {!connected ? (
          <p className="text-center text-muted-foreground">
            Connect your wallet to create a campaign
          </p>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={
              !title || !goal || !amountsMatch || loading ||
              milestones.some((m) => !m.title || !m.amount || !m.deadline)
            }
            className="w-full gap-2 bg-[#0F1724] hover:bg-[#1a2538]"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Campaign
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
