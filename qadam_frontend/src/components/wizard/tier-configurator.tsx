"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Lock } from "lucide-react";

export interface TierConfigItem {
  name: string;
  multiplier: number; // 0-1 (1.0 = 100%)
  max_spots: number | null; // null = unlimited
}

export interface TierConfiguratorProps {
  value: TierConfigItem[];
  onChange: (tiers: TierConfigItem[]) => void;
}

const DEFAULT_TIERS: TierConfigItem[] = [
  { name: "Founders", multiplier: 1.0, max_spots: 50 },
  { name: "Early Backers", multiplier: 0.7, max_spots: 200 },
  { name: "Supporters", multiplier: 0.5, max_spots: null },
];

export function TierConfigurator({ value, onChange }: TierConfiguratorProps) {
  const tiers = value.length > 0 ? value : DEFAULT_TIERS;

  const updateTier = (idx: number, field: keyof TierConfigItem, val: any) => {
    const updated = [...tiers];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const addTier = () => {
    if (tiers.length >= 10) return;
    const prevMultiplier = tiers[tiers.length - 1]?.multiplier || 0.5;
    // New tier goes before last (unlimited) tier
    const newTier: TierConfigItem = {
      name: `Tier ${tiers.length + 1}`,
      multiplier: Math.max(0.1, prevMultiplier - 0.1),
      max_spots: 100,
    };
    // Insert before last, make new last unlimited
    const updated = [...tiers];
    // Current last tier gets a spot limit
    updated[updated.length - 1] = { ...updated[updated.length - 1], max_spots: 500 };
    updated.push({ ...newTier, max_spots: null }); // new last is unlimited
    onChange(updated);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    const updated = tiers.filter((_, i) => i !== idx);
    // Ensure last tier is unlimited
    updated[updated.length - 1] = { ...updated[updated.length - 1], max_spots: null };
    onChange(updated);
  };

  // Preview text
  const previewParts = tiers.map((t, i) => {
    const pct = Math.round(t.multiplier * 100);
    if (i === tiers.length - 1) return `Everyone after earns ${pct}%`;
    return `${t.max_spots ? `First ${i === 0 ? t.max_spots : t.max_spots}` : "Next"} backers earn ${pct}%`;
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Tier structure</p>
        <p className="text-xs text-muted-foreground mb-4">The earlier a backer joins, the larger their share. Configure how that scales.</p>
      </div>

      <div className="space-y-2">
        {tiers.map((tier, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === tiers.length - 1;
          return (
            <div key={idx} className="flex items-center gap-2 p-3 border border-black/[0.06] rounded-xl bg-white">
              <div className="flex-1 min-w-0">
                <Input
                  value={tier.name}
                  onChange={(e) => updateTier(idx, "name", (e.target as HTMLInputElement).value)}
                  placeholder={`Tier ${idx + 1}`}
                  className="text-sm h-8 mb-1"
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground w-16">Multiplier</span>
                    {isFirst ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> 100%
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="range"
                          min={5}
                          max={Math.round((tiers[idx - 1]?.multiplier || 1) * 100)}
                          step={5}
                          value={Math.round(tier.multiplier * 100)}
                          onChange={(e) => updateTier(idx, "multiplier", parseInt(e.target.value) / 100)}
                          className="w-20 h-1 accent-amber-500"
                        />
                        <span className="text-xs font-medium w-10 text-right">{Math.round(tier.multiplier * 100)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Spots</span>
                    {isLast ? (
                      <span className="text-xs text-muted-foreground">Unlimited</span>
                    ) : (
                      <Input
                        type="number"
                        value={tier.max_spots || ""}
                        onChange={(e) => updateTier(idx, "max_spots", parseInt((e.target as HTMLInputElement).value) || 50)}
                        min={1}
                        className="text-xs h-7 w-16"
                      />
                    )}
                  </div>
                </div>
              </div>
              {!isFirst && (
                <Button variant="ghost" size="sm" onClick={() => removeTier(idx)} className="h-7 w-7 p-0 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {tiers.length < 10 && (
        <Button variant="outline" size="sm" onClick={addTier} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add tier ({tiers.length}/10)
        </Button>
      )}

      {/* Preview */}
      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
        <p className="text-xs text-amber-700">{previewParts.join(". ")}.</p>
      </div>
    </div>
  );
}
