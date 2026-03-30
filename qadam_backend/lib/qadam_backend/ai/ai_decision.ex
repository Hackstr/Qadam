defmodule QadamBackend.AI.AiDecision do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "ai_decisions" do
    field :prompt_hash, :string
    field :response_hash, :string
    field :decision, :string
    field :explanation, :string
    field :claude_model, :string
    field :latency_ms, :integer
    field :solana_tx_signature, :string

    belongs_to :milestone, QadamBackend.Milestones.Milestone

    timestamps(type: :utc_datetime)
  end

  def changeset(ai_decision, attrs) do
    ai_decision
    |> cast(attrs, [:milestone_id, :prompt_hash, :response_hash, :decision,
                    :explanation, :claude_model, :latency_ms, :solana_tx_signature])
    |> validate_required([:milestone_id, :decision])
    |> validate_inclusion(:decision, ~w(approved rejected partial))
  end
end
