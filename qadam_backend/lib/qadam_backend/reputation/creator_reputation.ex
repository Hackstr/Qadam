defmodule QadamBackend.Reputation.CreatorReputation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "creator_reputations" do
    field :wallet_address, :string
    field :score, :integer, default: 50
    field :milestones_on_time, :integer, default: 0
    field :milestones_late, :integer, default: 0
    field :campaigns_completed, :integer, default: 0
    field :campaigns_refunded, :integer, default: 0

    timestamps(type: :utc_datetime)
  end

  def changeset(reputation, attrs) do
    reputation
    |> cast(attrs, [:wallet_address, :score, :milestones_on_time, :milestones_late,
                    :campaigns_completed, :campaigns_refunded])
    |> validate_required([:wallet_address])
    |> validate_number(:score, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> unique_constraint(:wallet_address)
  end
end
