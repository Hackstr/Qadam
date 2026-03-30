defmodule QadamBackend.Milestones.StateTransition do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "milestone_state_transitions" do
    field :from_state, :string
    field :to_state, :string
    field :metadata, :map, default: %{}

    belongs_to :milestone, QadamBackend.Milestones.Milestone

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(transition, attrs) do
    transition
    |> cast(attrs, [:milestone_id, :from_state, :to_state, :metadata])
    |> validate_required([:milestone_id, :from_state, :to_state])
  end
end
