defmodule QadamBackend.Analytics.AnalyticsEvent do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "analytics_events" do
    field :event_type, :string
    field :wallet_address, :string
    field :properties, :map, default: %{}

    belongs_to :campaign, QadamBackend.Campaigns.Campaign

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:event_type, :wallet_address, :campaign_id, :properties])
    |> validate_required([:event_type])
  end
end
