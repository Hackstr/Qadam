"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCampaign, submitEvidence } from "@/lib/api";
import { useQadamProgram } from "@/hooks/use-qadam-program";
import { calculateEvidenceHash, hashFile } from "@/lib/evidence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol } from "@/lib/constants";
import {
  ArrowLeft, ArrowRight, Send, Loader2, Plus, Trash2,
  FileText, Eye, CheckCircle2, Link2, MessageSquare,
} from "lucide-react";
import { AiHelperButton } from "@/components/ai-helper/ai-helper-button";
import { toast } from "sonner";
import Link from "next/link";

export default function SubmitEvidencePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { submitMilestone: submitMilestoneTx, connected } = useQadamProgram();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [backerMessage, setBackerMessage] = useState("");

  const { data: campaignData } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const campaign = campaignData?.data;
  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  const currentMilestone = campaign.milestones?.find(
    (m) => m.status === "pending" || m.status === "grace_period" || m.status === "rejected" || m.status === "extended"
  );

  if (!currentMilestone) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">All caught up!</h2>
        <p className="text-muted-foreground">No milestones ready for submission right now.</p>
        <Link href={`/dashboard`} className="text-amber-500 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const addLink = () => setLinks([...links, ""]);
  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));
  const updateLink = (idx: number, value: string) => {
    const updated = [...links];
    updated[idx] = value;
    setLinks(updated);
  };

  const handleSubmit = async () => {
    if (!connected || !text.trim()) return;
    setLoading(true);

    try {
      const cleanLinks = links.filter((l) => l.trim());

      const fileHashes: string[] = [];
      if (files.length > 0) {
        const { uploadFile } = await import("@/lib/api");
        for (const file of files) {
          const [hash] = await Promise.all([hashFile(file), uploadFile(file)]);
          fileHashes.push(hash);
        }
      }

      const evidenceHash = await calculateEvidenceHash({
        text: [text, backerMessage].filter(Boolean).join("\n\n---\n\n"),
        links: cleanLinks,
        fileHashes,
        milestoneIndex: currentMilestone.index,
        campaignId: campaign.id,
      });

      await submitMilestoneTx(campaign.solana_pubkey, currentMilestone.index, evidenceHash);

      await submitEvidence(campaign.id, currentMilestone.index, {
        text: [text, backerMessage].filter(Boolean).join("\n\n---\n\n"),
        links: cleanLinks,
        evidence_hash: evidenceHash,
      });

      try {
        const { triggerMilestoneVerification } = await import("@/lib/api");
        await triggerMilestoneVerification(campaign.id, currentMilestone.index);
      } catch { /* verification trigger is best-effort */ }

      toast.success("Evidence submitted! Community voting will begin.", { duration: 6000 });
      router.push(`/campaigns/${campaign.id}`);
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      console.error("Submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    { num: 1, title: "Describe", icon: FileText },
    { num: 2, title: "Proof", icon: Link2 },
    { num: 3, title: "For Backers", icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-1">Submit Evidence</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {campaign.title} — Milestone {currentMilestone.index + 1}: {currentMilestone.title || "Untitled"}
      </p>

      {/* Milestone reminder */}
      <Card className="mb-6 bg-amber-50/30 border-amber-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Acceptance criteria</p>
            <Badge variant="secondary">{formatSol(currentMilestone.amount_lamports)}</Badge>
          </div>
          {currentMilestone.acceptance_criteria ? (
            <p className="text-xs text-muted-foreground leading-relaxed">{currentMilestone.acceptance_criteria}</p>
          ) : currentMilestone.description ? (
            <p className="text-xs text-muted-foreground">{currentMilestone.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No specific criteria set.</p>
          )}
        </CardContent>
      </Card>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center flex-1">
              <button
                onClick={() => isDone && setStep(s.num)}
                disabled={!isDone}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  isActive ? "text-amber-600" : isDone ? "text-green-600 cursor-pointer" : "text-muted-foreground/40"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${
                  isActive ? "border-amber-500 bg-amber-50 text-amber-600"
                  : isDone ? "border-green-500 bg-green-50 text-green-600"
                  : "border-black/[0.08] text-muted-foreground/40"
                }`}>
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : s.num}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${step > s.num ? "bg-green-300" : "bg-black/[0.06]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Steps */}
      <div className="space-y-6">

        {/* Step 1: What did you build? */}
        {step === 1 && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">What did you accomplish?</h3>
                <p className="text-xs text-muted-foreground mb-3">Describe what you built, what changed, what's new. Be specific.</p>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="We deployed the API with 12 endpoints. Full documentation at docs.example.com. 150 test requests logged in the first week..."
                  rows={6}
                />
                <AiHelperButton
                  context="evidence"
                  onApply={(t) => setText(t)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Screenshots (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    const valid = newFiles.filter((f) => f.size <= 5_000_000);
                    setFiles((prev) => [...prev, ...valid]);
                  }}
                  className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-700"
                />
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          {f.name} ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                        <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Proof links */}
        {step === 2 && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Show the proof</h3>
                <p className="text-xs text-muted-foreground mb-3">Links that backers can verify — demo URLs, GitHub, docs, analytics.</p>
              </div>

              {links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => updateLink(idx, e.target.value)}
                    placeholder={idx === 0 ? "Live demo URL (required)" : "Additional link..."}
                  />
                  {links.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeLink(idx)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLink} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Link
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Message for backers */}
        {step === 3 && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Message for your backers</h3>
                <p className="text-xs text-muted-foreground mb-3">This appears in the voting UI. What do you want your community to know?</p>
                <Textarea
                  value={backerMessage}
                  onChange={(e) => setBackerMessage(e.target.value)}
                  placeholder="Hey everyone! Here's what we shipped this milestone..."
                  rows={4}
                />
                <AiHelperButton
                  context="update"
                  onApply={(t) => setBackerMessage(t)}
                  className="mt-2"
                />
              </div>

              {/* Preview summary */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Submission summary</p>
                <div className="text-xs space-y-1">
                  <p>Description: {text ? `${text.slice(0, 80)}...` : "—"}</p>
                  <p>Links: {links.filter(l => l.trim()).length} provided</p>
                  <p>Files: {files.length} attached</p>
                  <p>Message: {backerMessage ? `${backerMessage.slice(0, 60)}...` : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !text.trim()}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : !connected ? (
            <p className="text-sm text-muted-foreground">Connect wallet to submit</p>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              className="gap-2 bg-[#0F1724] hover:bg-[#1a2538] text-white"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Community Review
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Evidence hash recorded on-chain. Community of backers will vote on your submission.
        </p>
      </div>
    </div>
  );
}
