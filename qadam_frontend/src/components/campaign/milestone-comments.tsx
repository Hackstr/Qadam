"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getMilestoneComments, postMilestoneComment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface MilestoneCommentsProps {
  milestoneId: string;
}

export function MilestoneComments({ milestoneId }: MilestoneCommentsProps) {
  const { connected, publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["milestone-comments", milestoneId],
    queryFn: () => getMilestoneComments(milestoneId),
    enabled: expanded,
  });

  const postMutation = useMutation({
    mutationFn: () => postMilestoneComment(milestoneId, newComment),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["milestone-comments", milestoneId] });
      toast.success("Comment posted");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const comments = data?.data || [];

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Discussion
      </button>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Discussion ({comments.length})</span>
      </div>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">
                  {c.display_name || `${c.wallet_address?.slice(0, 4)}...${c.wallet_address?.slice(-4)}`}
                </span>
                <span className="text-muted-foreground/50">
                  {new Date(c.inserted_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {connected ? (
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="text-xs h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newComment.trim()) postMutation.mutate();
            }}
          />
          <Button
            size="sm"
            onClick={() => postMutation.mutate()}
            disabled={!newComment.trim() || postMutation.isPending}
            className="h-8 gap-1 px-3"
          >
            {postMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Connect wallet to comment.</p>
      )}
    </div>
  );
}
