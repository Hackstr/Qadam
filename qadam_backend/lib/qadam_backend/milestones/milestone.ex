defmodule QadamBackend.Milestones.Milestone do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_statuses ~w(pending grace_period submitted ai_processing under_human_review
                     approved rejected extension_requested voting_active extended failed)

  schema "milestones" do
    field :index, :integer
    field :title, :string
    field :description, :string
    field :acceptance_criteria, :string
    field :amount_lamports, :integer
    field :deadline, :utc_datetime
    field :grace_deadline, :utc_datetime
    field :extension_deadline, :utc_datetime
    field :status, :string, default: "pending"

    # Evidence
    field :evidence_text, :string
    field :evidence_links, {:array, :string}, default: []
    field :evidence_files, :map, default: %{}
    field :evidence_hash, :string

    # AI decision
    field :ai_decision, :string
    field :ai_explanation, :string
    field :ai_decision_hash, :string
    field :ai_solana_tx, :string

    # Foundation v1 — structured acceptance criteria + deliverables
    field :acceptance_criteria_list, {:array, :string}, default: []
    field :deliverables, :string

    field :submitted_at, :utc_datetime
    field :decided_at, :utc_datetime
    field :released_at, :utc_datetime

    belongs_to :campaign, QadamBackend.Campaigns.Campaign

    has_many :ai_decisions, QadamBackend.AI.AiDecision
    has_many :state_transitions, QadamBackend.Milestones.StateTransition

    timestamps(type: :utc_datetime)
  end

  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [
      :campaign_id, :index, :title, :description, :acceptance_criteria,
      :amount_lamports, :deadline, :grace_deadline, :extension_deadline,
      :status, :evidence_text, :evidence_links, :evidence_files, :evidence_hash,
      :ai_decision, :ai_explanation, :ai_decision_hash, :ai_solana_tx,
      :submitted_at, :decided_at, :released_at,
      :acceptance_criteria_list, :deliverables
    ])
    |> validate_required([:campaign_id, :index, :amount_lamports, :deadline, :status])
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_acceptance_criteria_list()
    |> unique_constraint([:campaign_id, :index])
  end

  defp validate_acceptance_criteria_list(changeset) do
    case get_change(changeset, :acceptance_criteria_list) do
      nil -> changeset
      items when is_list(items) ->
        cond do
          length(items) > 5 ->
            add_error(changeset, :acceptance_criteria_list, "max 5 criteria")
          Enum.any?(items, &(String.length(&1) > 200)) ->
            add_error(changeset, :acceptance_criteria_list, "each criterion max 200 chars")
          true -> changeset
        end
      _ -> changeset
    end
  end
end
