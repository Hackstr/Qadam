defmodule QadamBackend.Backers.BackerPosition do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "backer_positions" do
    field :wallet_address, :string
    field :amount_lamports, :integer
    field :tokens_allocated, :integer
    field :tokens_claimed, :integer, default: 0
    field :tier, :integer
    field :refund_claimed, :boolean, default: false

    belongs_to :campaign, QadamBackend.Campaigns.Campaign

    timestamps(type: :utc_datetime)
  end

  def changeset(position, attrs) do
    position
    |> cast(attrs, [:campaign_id, :wallet_address, :amount_lamports,
                    :tokens_allocated, :tokens_claimed, :tier, :refund_claimed])
    |> validate_required([:campaign_id, :wallet_address, :amount_lamports, :tokens_allocated, :tier])
    |> validate_inclusion(:tier, [1, 2, 3])
    |> unique_constraint([:campaign_id, :wallet_address])
  end
end
