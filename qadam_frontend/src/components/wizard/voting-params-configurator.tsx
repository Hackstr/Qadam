"use client";

export interface VotingParams {
  vote_period_days: number;
  quorum_pct: number;
  approval_threshold_pct: number;
}

export interface VotingParamsConfiguratorProps {
  value: VotingParams;
  onChange: (params: VotingParams) => void;
}

const DEFAULTS: VotingParams = {
  vote_period_days: 7,
  quorum_pct: 0.2,
  approval_threshold_pct: 0.5,
};

export function VotingParamsConfigurator({ value, onChange }: VotingParamsConfiguratorProps) {
  const params = value || DEFAULTS;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-1">Voting rules</p>
        <p className="text-xs text-muted-foreground mb-4">These lock at launch. Backers vote with these rules on every milestone.</p>
      </div>

      {/* Vote period */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">Vote period</label>
          <span className="text-xs font-semibold text-amber-600">{params.vote_period_days} days</span>
        </div>
        <input
          type="range"
          min={3}
          max={14}
          step={1}
          value={params.vote_period_days}
          onChange={(e) => onChange({ ...params, vote_period_days: parseInt(e.target.value) })}
          className="w-full h-1.5 accent-amber-500"
        />
        <p className="text-[11px] text-muted-foreground mt-1">How long voting stays open after evidence is submitted.</p>
      </div>

      {/* Quorum */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">Quorum</label>
          <span className="text-xs font-semibold text-amber-600">{Math.round(params.quorum_pct * 100)}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={Math.round(params.quorum_pct * 100)}
          onChange={(e) => onChange({ ...params, quorum_pct: parseInt(e.target.value) / 100 })}
          className="w-full h-1.5 accent-amber-500"
        />
        <p className="text-[11px] text-muted-foreground mt-1">Minimum participation for a vote to be valid. Lower = easier to pass.</p>
      </div>

      {/* Approval threshold */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">Approval threshold</label>
          <span className="text-xs font-semibold text-amber-600">{Math.round(params.approval_threshold_pct * 100)}%</span>
        </div>
        <input
          type="range"
          min={50}
          max={75}
          step={5}
          value={Math.round(params.approval_threshold_pct * 100)}
          onChange={(e) => onChange({ ...params, approval_threshold_pct: parseInt(e.target.value) / 100 })}
          className="w-full h-1.5 accent-amber-500"
        />
        <p className="text-[11px] text-muted-foreground mt-1">% of participating weight that must vote YES. 50% = simple majority.</p>
      </div>

      {/* Reset to defaults */}
      <button
        onClick={() => onChange(DEFAULTS)}
        className="text-xs text-amber-600 hover:underline"
      >
        Reset to recommended defaults (7 days / 20% / 50%)
      </button>
    </div>
  );
}
