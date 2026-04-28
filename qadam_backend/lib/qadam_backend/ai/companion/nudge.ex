defmodule QadamBackend.AI.Companion.Nudge do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "companion_nudges" do
    field :campaign_id, :binary_id
    field :creator_wallet, :string
    field :title, :string
    field :body, :string
    field :primary_cta_label, :string
    field :primary_cta_action, :string
    field :generated_at, :utc_datetime
    field :dismissed_at, :utc_datetime
    field :read_at, :utc_datetime
    field :source_signals, :map, default: %{}

    timestamps(type: :utc_datetime)
  end

  def changeset(nudge, attrs) do
    nudge
    |> cast(attrs, [:campaign_id, :creator_wallet, :title, :body, :primary_cta_label,
                    :primary_cta_action, :generated_at, :dismissed_at, :read_at, :source_signals])
    |> validate_required([:campaign_id, :creator_wallet, :title, :body, :generated_at])
  end
end
