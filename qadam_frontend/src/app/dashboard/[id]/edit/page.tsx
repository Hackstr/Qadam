"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaign, updateCampaign, uploadCoverImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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

  const [description, setDescription] = useState("");
  const [pitchVideoUrl, setPitchVideoUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    if (campaign) {
      setDescription(campaign.description || "");
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
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href={`/dashboard`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-1">Edit Campaign</h1>
      <p className="text-muted-foreground text-sm mb-6">{campaign.title}</p>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Cover Image</label>
            {coverPreview && (
              <img src={coverPreview} alt="Cover" className="h-32 w-full object-cover rounded-lg border mb-2" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5_000_000) { toast.error("Max 5MB"); return; }
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
              }}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-700"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Pitch Video URL</label>
            <Input
              value={pitchVideoUrl}
              onChange={(e) => setPitchVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... or https://loom.com/..."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Title, milestones, and funding goal cannot be changed after launch.
          </p>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
