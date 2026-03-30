defmodule QadamBackend.Governance.ExtensionVote do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "extension_votes" do
    field :voter_wallet, :string
    field :voting_power, :integer
    field :vote_approve, :boolean

    belongs_to :milestone, QadamBackend.Milestones.Milestone

    timestamps(type: :utc_datetime)
  end

  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [:milestone_id, :voter_wallet, :voting_power, :vote_approve])
    |> validate_required([:milestone_id, :voter_wallet, :voting_power, :vote_approve])
    |> unique_constraint([:milestone_id, :voter_wallet])
  end
end
