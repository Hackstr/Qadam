defmodule QadamBackend.AI.AiDecision do
  @moduledoc """
  Legacy schema — AI verification decisions removed in Foundation v1.
  Community votes now resolve milestones.
  Schema kept for migration compatibility only.
  """
  use Ecto.Schema

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
end
