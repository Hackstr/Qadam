defmodule QadamBackend.Repo.Migrations.FoundationV1DataModel do
  use Ecto.Migration

  def up do
    # ── 1. Users table: add Creator Profile fields ──
    alter table(:users) do
      add_if_not_exists :bio, :text
      add_if_not_exists :location, :string
      add_if_not_exists :socials, :map, default: %{}
      add_if_not_exists :previous_work, {:array, :map}, default: []
    end

    # ── 2. Campaigns table: Foundation v1 fields ──
    alter table(:campaigns) do
      # Story split (replaces single 'description' — keep description for backwards compat)
      add_if_not_exists :problem, :text
      add_if_not_exists :solution, :text
      add_if_not_exists :why_now, :text
      add_if_not_exists :background, :text
      add_if_not_exists :risks, :text

      # Team
      add_if_not_exists :team_members, {:array, :map}, default: []

      # Funding
      add_if_not_exists :funding_deadline, :utc_datetime

      # Tier config (per-campaign, configurable)
      add_if_not_exists :tier_config, {:array, :map}, default: [
        %{"name" => "Founders", "multiplier" => 1.00, "max_spots" => 50},
        %{"name" => "Early Backers", "multiplier" => 0.70, "max_spots" => 200},
        %{"name" => "Supporters", "multiplier" => 0.50, "max_spots" => nil}
      ]

      # Voting params (per-campaign, configurable)
      add_if_not_exists :vote_period_days, :integer, default: 7
      add_if_not_exists :quorum_pct, :decimal, default: 0.2000
      add_if_not_exists :approval_threshold_pct, :decimal, default: 0.5000

      # Discovery
      add_if_not_exists :location, :string
      add_if_not_exists :tags, {:array, :string}, default: []
      add_if_not_exists :slug, :string

      # Timestamps
      add_if_not_exists :launched_at, :utc_datetime
      add_if_not_exists :funded_at, :utc_datetime
    end

    # Add slug index
    create_if_not_exists unique_index(:campaigns, [:slug])

    # ── 3. Milestones table: structured acceptance criteria + deliverables ──
    alter table(:milestones) do
      # acceptance_criteria currently :string — add as array alongside
      add_if_not_exists :acceptance_criteria_list, {:array, :string}, default: []
      add_if_not_exists :deliverables, :text
    end
  end

  def down do
    alter table(:users) do
      remove_if_exists :bio, :text
      remove_if_exists :location, :string
      remove_if_exists :socials, :map
      remove_if_exists :previous_work, {:array, :map}
    end

    alter table(:campaigns) do
      remove_if_exists :problem, :text
      remove_if_exists :solution, :text
      remove_if_exists :why_now, :text
      remove_if_exists :background, :text
      remove_if_exists :risks, :text
      remove_if_exists :team_members, {:array, :map}
      remove_if_exists :funding_deadline, :utc_datetime
      remove_if_exists :tier_config, {:array, :map}
      remove_if_exists :vote_period_days, :integer
      remove_if_exists :quorum_pct, :decimal
      remove_if_exists :approval_threshold_pct, :decimal
      remove_if_exists :location, :string
      remove_if_exists :tags, {:array, :string}
      remove_if_exists :slug, :string
      remove_if_exists :launched_at, :utc_datetime
      remove_if_exists :funded_at, :utc_datetime
    end

    drop_if_exists unique_index(:campaigns, [:slug])

    alter table(:milestones) do
      remove_if_exists :acceptance_criteria_list, {:array, :string}
      remove_if_exists :deliverables, :text
    end
  end
end
