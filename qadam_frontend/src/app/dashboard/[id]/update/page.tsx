"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaign, postCampaignUpdate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { AiHelperButton } from "@/components/ai-helper/ai-helper-button";
import { toast } from "sonner";
import Link from "next/link";

export default function PostUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => getCampaign(id),
    enabled: !!id,
  });

  const campaign = data?.data;

  const mutation = useMutation({
    mutationFn: () => postCampaignUpdate(id, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Update posted! Your backers will be notified.");
      router.push(`/campaigns/${id}`);
    },
    onError: () => toast.error("Failed to post update"),
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Campaign Update</p>
        <h1 className="text-3xl font-bold tracking-tight">Post an update</h1>
        <p className="text-muted-foreground mt-1">{campaign?.title || "Loading..."}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 2 Progress Report"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you've been working on, any wins, challenges, or changes..."
              rows={8}
            />
            <AiHelperButton
              context="update"
              onApply={(text) => setContent(text)}
              className="mt-2"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            All backers will be notified about this update.
          </p>

          <Button
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || !content.trim() || mutation.isPending}
            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full"
            size="lg"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post Update
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
