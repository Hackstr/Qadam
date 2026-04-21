"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiHelp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AiHelperButtonProps {
  context: "title" | "description" | "milestones" | "evidence" | "update";
  placeholder?: string;
  onApply: (text: string) => void;
  className?: string;
}

export function AiHelperButton({ context, placeholder, onApply, className }: AiHelperButtonProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => aiHelp(context, input),
    onSuccess: (data) => setResult(data.response),
    onError: () => toast.error("AI Helper temporarily unavailable"),
  });

  const contextLabels: Record<string, string> = {
    title: "Help me craft a project name and pitch",
    description: "Help me write a project description",
    milestones: "Help me structure milestones",
    evidence: "Help me describe my progress",
    update: "Help me write a backer update",
  };

  const contextPrompts: Record<string, string> = {
    title: "Tell me about your project in 2-3 sentences. What are you building and for whom?",
    description: "Describe your project: what problem, why now, who benefits?",
    milestones: "What's the final goal of your project? What are the main phases to get there?",
    evidence: "What did you accomplish for this milestone? What can you show?",
    update: "What happened this week? Any wins, challenges, or changes?",
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={`gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 ${className || ""}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {contextLabels[context] || "AI Helper"}
      </Button>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
          <Sparkles className="h-4 w-4" />
          AI Helper
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setResult(""); setInput(""); }} className="h-6 w-6 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!result ? (
        <>
          <p className="text-xs text-muted-foreground">{contextPrompts[context]}</p>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder || "Tell me about your project..."}
            rows={3}
            className="text-sm"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!input.trim() || mutation.isPending}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
          >
            {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate
          </Button>
        </>
      ) : (
        <>
          <div className="bg-white rounded-lg border p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {result}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => { onApply(result); setOpen(false); setResult(""); setInput(""); toast.success("Applied!"); }}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setResult(""); }}
            >
              Try again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
