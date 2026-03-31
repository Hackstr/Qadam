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
  amount: string;
  deadline: string;
}

export default function CreateCampaignPage() {
  const { connected, createCampaign: createCampaignTx, txStatus } = useQadamProgram();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Apps");
  const [goal, setGoal] = useState("");
  const [tokensPerLamport, setTokensPerLamport] = useState("100");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", amount: "", deadline: "" },
  ]);

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    setMilestones([...milestones, { title: "", description: "", amount: "", deadline: "" }]);
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
        tokensPerLamport: parseInt(tokensPerLamport) || 100,
        milestones: milestones.map((m) => ({
          amountSol: parseFloat(m.amount) || 0,
          deadline: new Date(m.deadline),
        })),
      });
      console.log("Campaign created:", result);
      router.push("/dashboard");
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
      <p className="text-muted-foreground mb-8">
        Define your project, set milestones, and start receiving funding.
      </p>

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
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="What will you deliver? Include acceptance criteria."
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-4">
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
            <CardTitle>Token Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-1 block">Tokens per SOL (base rate)</label>
              <Input
                type="number"
                value={tokensPerLamport}
                onChange={(e) => setTokensPerLamport(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tier 1 (Genesis): {tokensPerLamport} tokens/SOL &middot; Tier 2 (Early): {Math.floor(Number(tokensPerLamport) * 0.67)} tokens/SOL &middot; Tier 3: {Math.floor(Number(tokensPerLamport) * 0.5)} tokens/SOL
              </p>
            </div>
          </CardContent>
        </Card>

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
