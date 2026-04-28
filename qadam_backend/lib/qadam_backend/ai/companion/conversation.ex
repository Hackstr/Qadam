defmodule QadamBackend.AI.Companion.Conversation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "companion_conversations" do
    field :campaign_id, :binary_id
    field :creator_wallet, :string
    field :started_at, :utc_datetime

    has_many :messages, QadamBackend.AI.Companion.Message

    timestamps(type: :utc_datetime)
  end

  def changeset(conv, attrs) do
    conv
    |> cast(attrs, [:campaign_id, :creator_wallet, :started_at])
    |> validate_required([:campaign_id, :creator_wallet, :started_at])
  end
end
