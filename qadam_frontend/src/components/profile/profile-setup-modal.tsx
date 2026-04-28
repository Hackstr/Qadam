"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";

export interface ProfileSetupModalProps {
  open: boolean;
  onComplete: (data: ProfileFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface ProfileFormData {
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  socials?: {
    twitter?: string;
    telegram?: string;
    github?: string;
    website?: string;
  };
}

export function ProfileSetupModal({ open, onComplete, onCancel, isSubmitting }: ProfileSetupModalProps) {
  const [form, setForm] = useState<ProfileFormData>({
    display_name: "",
    bio: "",
    location: "",
    socials: { twitter: "", telegram: "", github: "", website: "" },
  });

  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    const name = form.display_name.trim();
    if (!name || name.length < 1) {
      setError("Display name is required");
      return;
    }
    if (name.length > 50) {
      setError("Display name must be 50 characters or less");
      return;
    }
    setError("");
    onComplete(form);
  };

  const bioLength = (form.bio || "").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Set up your profile</h2>
            <p className="text-sm text-muted-foreground mt-1">Backers want to know who they're funding.</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Display Name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name <span className="text-red-500">*</span></label>
            <Input
              placeholder="Your name or alias"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: (e.target as HTMLInputElement).value })}
              maxLength={50}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Bio</label>
              <span className={`text-xs ${bioLength > 260 ? "text-amber-600" : "text-muted-foreground"}`}>{bioLength}/280</span>
            </div>
            <Textarea
              placeholder="A short intro about you — what you build, where you're based"
              value={form.bio || ""}
              onChange={(e) => setForm({ ...form, bio: (e.target as HTMLTextAreaElement).value })}
              maxLength={280}
              rows={3}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Location</label>
            <Input
              placeholder="City, Country"
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: (e.target as HTMLInputElement).value })}
            />
          </div>

          {/* Socials */}
          <div>
            <label className="text-sm font-medium mb-2 block">Social links</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Twitter / X</label>
                <Input
                  placeholder="@handle"
                  value={form.socials?.twitter || ""}
                  onChange={(e) => setForm({ ...form, socials: { ...form.socials, twitter: (e.target as HTMLInputElement).value } })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telegram</label>
                <Input
                  placeholder="@username"
                  value={form.socials?.telegram || ""}
                  onChange={(e) => setForm({ ...form, socials: { ...form.socials, telegram: (e.target as HTMLInputElement).value } })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">GitHub</label>
                <Input
                  placeholder="username"
                  value={form.socials?.github || ""}
                  onChange={(e) => setForm({ ...form, socials: { ...form.socials, github: (e.target as HTMLInputElement).value } })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Website</label>
                <Input
                  placeholder="https://..."
                  value={form.socials?.website || ""}
                  onChange={(e) => setForm({ ...form, socials: { ...form.socials, website: (e.target as HTMLInputElement).value } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full gap-2 px-6"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
