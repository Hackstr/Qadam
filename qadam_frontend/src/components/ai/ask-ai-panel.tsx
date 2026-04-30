"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function AskAiTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full px-4 h-11 shadow-lg hover:shadow-xl transition-shadow"
    >
      <Sparkles className="h-4 w-4" />
      <span className="text-sm font-medium">Ask AI</span>
    </button>
  );
}

export function AskAiPanel({
  campaignId,
  campaignTitle,
  open,
  onClose,
}: {
  campaignId: string;
  campaignTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("qadam_token");

      if (campaignId) {
        // Campaign-specific companion chat
        const res = await fetch(`${API_URL}/ai/companion_chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ campaign_id: campaignId, conversation_id: conversationId, message: msg }),
        });
        if (res.ok) {
          const data = await res.json();
          setConversationId(data.data.conversation_id);
          setMessages((prev) => [...prev, { role: "assistant", content: data.data.response }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
        }
      } else {
        // General AI help (no campaign context)
        const res = await fetch(`${API_URL}/ai/help`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ context: "general", prompt: msg }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, { role: "assistant", content: data.data?.text || data.text || "I'm here to help with your Qadam projects." }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white border-l border-black/[0.06] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.25)]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Qadam AI</p>
          <p className="text-[10px] text-muted-foreground truncate">{campaignTitle}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Suggestions (if no messages) */}
      {messages.length === 0 && (
        <div className="p-5 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Suggested questions:</p>
          {[
            "What should I do today to reach the milestone?",
            "How does my plan compare to similar projects?",
            "Help me write an update for backers",
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-[#FAFAFA] border border-black/[0.04] hover:border-amber-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#0F172A] text-white rounded-[14px_14px_4px_14px]"
                : "bg-[#FAFAFA] border border-black/[0.04] rounded-[14px_14px_14px_4px]"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3 w-3 text-white animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="bg-[#FAFAFA] border border-black/[0.04] rounded-2xl px-3.5 py-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/[0.04]">
        <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-amber-500 bg-white">
          <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this campaign..."
            className="flex-1 text-sm bg-transparent outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Send className="h-3.5 w-3.5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
