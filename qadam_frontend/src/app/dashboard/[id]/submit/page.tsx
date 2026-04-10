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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSol } from "@/lib/constants";
import { ArrowLeft, Send, Loader2, Plus, Trash2, Upload, FileText } from "lucide-react";
import Link from "next/link";

export default function SubmitEvidencePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { submitMilestone: submitMilestoneTx, connected } = useQadamProgram();

  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

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

  // Find next milestone to submit (first non-approved)
  const currentMilestone = campaign.milestones?.find(
    (m) => m.status === "pending" || m.status === "grace_period" || m.status === "rejected" || m.status === "extended"
  );

  if (!currentMilestone) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold mb-2">No milestone ready for submission</h2>
        <p className="text-muted-foreground">All milestones are either approved or in review.</p>
        <Link href="/dashboard" className="text-amber-500 hover:underline mt-4 inline-block">
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

      // 1. Upload files and compute hashes
      const fileHashes: string[] = [];
      if (files.length > 0) {
        const { uploadFile } = await import("@/lib/api");
        const urls: string[] = [];
        for (const file of files) {
          const [hash, uploaded] = await Promise.all([
            hashFile(file),
            uploadFile(file),
          ]);
          fileHashes.push(hash);
          urls.push(uploaded.url);
        }
        setUploadedFileUrls(urls);
      }

      // 2. Calculate evidence hash (client-side, matches backend)
      const evidenceHash = await calculateEvidenceHash({
        text,
        links: cleanLinks,
        fileHashes,
        milestoneIndex: currentMilestone.index,
        campaignId: campaign.id,
      });

      // 2. Submit hash on-chain via Anchor program
      const sig = await submitMilestoneTx(
        campaign.solana_pubkey,
        currentMilestone.index,
        evidenceHash
      );
      console.log("On-chain submit tx:", sig);

      // 3. Submit evidence content to backend API
      await submitEvidence(campaign.id, currentMilestone.index, {
        text,
        links: cleanLinks,
        evidence_hash: evidenceHash,
      });

      // 4. Trigger AI verification pipeline
      try {
        const { triggerMilestoneVerification } = await import("@/lib/api");
        await triggerMilestoneVerification(campaign.id, currentMilestone.index);
      } catch {
        // Non-critical — webhook may fail if not authenticated
      }

      router.push("/dashboard");
    } catch (err: any) {
      if (err?.message === "cancelled") return;
      console.error("Submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">Submit Evidence</h1>
      <p className="text-muted-foreground mb-8">
        Campaign: <span className="font-medium text-foreground">{campaign.title}</span>
      </p>

      {/* Current milestone info */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Milestone {currentMilestone.index + 1}: {currentMilestone.title || "Untitled"}
            </CardTitle>
            <Badge variant="secondary">{formatSol(currentMilestone.amount_lamports)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentMilestone.description && (
            <p className="text-sm text-muted-foreground mb-2">{currentMilestone.description}</p>
          )}
          {currentMilestone.acceptance_criteria && (
            <div className="bg-muted/50 p-3 rounded text-sm">
              <p className="font-medium mb-1">Acceptance Criteria:</p>
              <p className="text-muted-foreground">{currentMilestone.acceptance_criteria}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Deadline: {new Date(currentMilestone.deadline).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Evidence form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What did you accomplish?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you've done for this milestone. Be specific — AI will evaluate this."
              rows={6}
              className="resize-none"
            />

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Demo Links</label>
                <Button variant="ghost" size="sm" onClick={addLink}>
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
              </div>
              {links.map((link, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={link}
                    onChange={(e) => updateLink(idx, e.target.value)}
                    placeholder="https://..."
                  />
                  {links.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeLink(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Files */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Attachments</label>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.zip,.txt"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  const valid = newFiles.filter((f) => f.size <= 5_000_000);
                  if (valid.length < newFiles.length) {
                    import("sonner").then(({ toast }) => toast.error("Some files exceeded 5MB limit"));
                  }
                  setFiles((prev) => [...prev, ...valid]);
                }}
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-700 hover:file:bg-amber-100"
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                      <span className="flex items-center gap-1.5 truncate">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        {f.name}
                        <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
                      </span>
                      <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Screenshots, documents, APKs (max 5MB each). File hashes are included in evidence hash.</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        {!connected ? (
          <p className="text-center text-muted-foreground">
            Connect your wallet to submit evidence
          </p>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="w-full gap-2 bg-[#0F1724] hover:bg-[#1a2538]"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Submitting..." : "Submit Evidence"}
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Evidence hash will be recorded on-chain, then Claude AI will verify your submission.
        </p>
      </div>
    </div>
  );
}
