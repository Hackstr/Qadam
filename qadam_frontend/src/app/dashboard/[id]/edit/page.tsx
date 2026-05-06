"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaign, updateCampaign, uploadCoverImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Image } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const campaign = data?.data;

  // Editable off-chain fields
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [background, setBackground] = useState("");
  const [risks, setRisks] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    if (campaign) {
      setDescription(campaign.description || "");
      setProblem(campaign.problem || "");
      setSolution(campaign.solution || "");
      setWhyNow(campaign.why_now || "");
      setBackground(campaign.background || "");
      setRisks(campaign.risks || "");
      setPitchVideoUrl(campaign.pitch_video_url || "");
      if (campaign.cover_image_url) setCoverPreview(campaign.cover_image_url);
    }
  }, [campaign]);

  const mutation = useMutation({
    mutationFn: async () => {
      let coverUrl = campaign?.cover_image_url;
      if (coverFile) {
        try {
          const uploaded = await uploadCoverImage(coverFile);
          coverUrl = uploaded.url;
        } catch { /* keep existing */ }
      }
      return updateCampaign(id, {
        description,
        problem: problem || undefined,
        solution: solution || undefined,
        why_now: whyNow || undefined,
        background: background || undefined,
        risks: risks || undefined,
        pitch_video_url: pitchVideoUrl || undefined,
        cover_image_url: coverUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Campaign updated");
      router.push(`/campaigns/${id}`);
    },
    onError: () => toast.error("Failed to update"),
  });

  if (!campaign) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-page-enter">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="font-display text-2xl tracking-tight mb-1">Edit Campaign</h1>
      <p className="text-muted-foreground text-sm mb-6">{campaign.title}</p>

      <div className="space-y-6">
        {/* Cover image */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <label className="text-sm font-medium block">Cover Image</label>
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden h-36">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setCoverFile(null); setCoverPreview(""); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-black/[0.08] rounded-xl cursor-pointer hover:border-black/[0.15] transition-colors">
                <Image className="h-6 w-6 text-muted-foreground/40 mb-1" />
                <span className="text-xs text-muted-foreground">Click to upload (PNG, JPG, up to 5 MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5_000_000) { toast.error("Max 5MB"); return; }
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Story fields (Foundation v1) */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm font-medium">Story</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">The Problem</label>
              <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} placeholder="What's broken?" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">The Solution</label>
              <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} placeholder="How does this fix it?" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Why Now</label>
              <Textarea value={whyNow} onChange={(e) => setWhyNow(e.target.value)} rows={2} placeholder="What changed?" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Background</label>
              <Textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={2} placeholder="Context" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Risks & Challenges</label>
              <Textarea value={risks} onChange={(e) => setRisks(e.target.value)} rows={2} placeholder="What could go wrong?" />
            </div>
          </CardContent>
        </Card>

        {/* Description (legacy) + video */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              <p className="text-xs text-muted-foreground mt-1">Legacy field — used if no story split fields above.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Pitch Video URL</label>
              <Input value={pitchVideoUrl} onChange={(e) => setPitchVideoUrl(e.target.value)} placeholder="https://youtube.com/... or https://loom.com/..." />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Title, milestones, tiers, and voting rules cannot be changed after launch.
        </p>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full"
          size="lg"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
