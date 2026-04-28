defmodule QadamBackend.Campaigns.Campaign do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_statuses ~w(draft active funded in_progress completed failed refunded paused cancelled)
  @valid_categories ["Tech", "Hardware", "Software", "Art & Design", "Music", "Film", "Education", "Community", "Research", "Climate",
                     "Apps", "Games", "SaaS", "Tools", "Infrastructure"]

  schema "campaigns" do
    field :solana_pubkey, :string
    field :creator_wallet, :string
    field :title, :string
    field :description, :string
    field :category, :string
    field :cover_image_url, :string
    field :pitch_video_url, :string
    field :goal_lamports, :integer
    field :raised_lamports, :integer, default: 0
    field :backers_count, :integer, default: 0
    field :token_mint_address, :string
    field :status, :string, default: "draft"
    field :milestones_count, :integer
    field :milestones_approved, :integer, default: 0
    field :tokens_per_lamport, :integer, default: 100
    field :featured, :boolean, default: false

    # Foundation v1 — Story split
    field :problem, :string
    field :solution, :string
    field :why_now, :string
    field :background, :string
    field :risks, :string

    # Foundation v1 — Team
    field :team_members, {:array, :map}, default: []

    # Foundation v1 — Funding
    field :funding_deadline, :utc_datetime
    field :slug, :string

    # Foundation v1 — Tier config (per-campaign)
    field :tier_config, {:array, :map}, default: [
      %{"name" => "Founders", "multiplier" => 1.00, "max_spots" => 50},
      %{"name" => "Early Backers", "multiplier" => 0.70, "max_spots" => 200},
      %{"name" => "Supporters", "multiplier" => 0.50, "max_spots" => nil}
    ]

    # Foundation v1 — Voting params (per-campaign)
    field :vote_period_days, :integer, default: 7
    field :quorum_pct, :decimal, default: Decimal.new("0.2000")
    field :approval_threshold_pct, :decimal, default: Decimal.new("0.5000")

    # Foundation v1 — Discovery
    field :location, :string
    field :tags, {:array, :string}, default: []

    # Foundation v1 — Timestamps
    field :launched_at, :utc_datetime
    field :funded_at, :utc_datetime

    has_many :milestones, QadamBackend.Milestones.Milestone
    has_many :backer_positions, QadamBackend.Backers.BackerPosition

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(solana_pubkey creator_wallet title goal_lamports milestones_count status)a
  @optional_fields ~w(description category cover_image_url pitch_video_url
                      raised_lamports backers_count token_mint_address
                      tokens_per_lamport milestones_approved featured
                      problem solution why_now background risks
                      team_members funding_deadline slug
                      tier_config vote_period_days quorum_pct approval_threshold_pct
                      location tags launched_at funded_at)a

  def changeset(campaign, attrs) do
    campaign
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_category()
    |> validate_vote_period_days()
    |> validate_quorum_pct()
    |> validate_approval_threshold_pct()
    |> validate_tier_config()
    |> unique_constraint(:solana_pubkey)
    |> unique_constraint(:slug)
  end

  defp validate_category(changeset) do
    case get_change(changeset, :category) do
      nil -> changeset
      cat when cat in @valid_categories -> changeset
      _ -> add_error(changeset, :category, "is invalid")
    end
  end

  defp validate_vote_period_days(changeset) do
    validate_number(changeset, :vote_period_days,
      greater_than_or_equal_to: 3,
      less_than_or_equal_to: 14
    )
  end

  defp validate_quorum_pct(changeset) do
    validate_number(changeset, :quorum_pct,
      greater_than_or_equal_to: Decimal.new("0.10"),
      less_than_or_equal_to: Decimal.new("0.50")
    )
  end

  defp validate_approval_threshold_pct(changeset) do
    validate_number(changeset, :approval_threshold_pct,
      greater_than_or_equal_to: Decimal.new("0.50"),
      less_than_or_equal_to: Decimal.new("0.75")
    )
  end

  defp validate_tier_config(changeset) do
    case get_change(changeset, :tier_config) do
      nil -> changeset
      tiers when is_list(tiers) ->
        cond do
          length(tiers) < 1 or length(tiers) > 10 ->
            add_error(changeset, :tier_config, "must have between 1 and 10 tiers")

          not tier_first_is_100?(tiers) ->
            add_error(changeset, :tier_config, "first tier multiplier must be 1.00")

          not tiers_monotonically_decreasing?(tiers) ->
            add_error(changeset, :tier_config, "multipliers must be monotonically decreasing")

          not tier_last_unlimited?(tiers) ->
            add_error(changeset, :tier_config, "last tier must have unlimited spots (max_spots: null)")

          true -> changeset
        end
      _ -> add_error(changeset, :tier_config, "must be a list")
    end
  end

  defp tier_first_is_100?([first | _]) do
    (first["multiplier"] || 0) == 1.0 or (first["multiplier"] || 0) == 1
  end
  defp tier_first_is_100?(_), do: false

  defp tiers_monotonically_decreasing?(tiers) do
    multipliers = Enum.map(tiers, & &1["multiplier"])
    multipliers == Enum.sort(multipliers, :desc)
  end

  defp tier_last_unlimited?(tiers) do
    last = List.last(tiers)
    last["max_spots"] == nil
  end
end
