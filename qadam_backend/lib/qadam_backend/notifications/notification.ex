defmodule QadamBackend.Notifications.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "notifications" do
    field :wallet_address, :string
    field :type, :string
    field :title, :string
    field :message, :string
    field :read, :boolean, default: false

    belongs_to :campaign, QadamBackend.Campaigns.Campaign

    timestamps(type: :utc_datetime, updated_at: false)
  end

  @valid_types ~w(milestone_approved milestone_rejected milestone_submitted
                  vote_opened refund_available campaign_update)

  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:wallet_address, :type, :title, :message, :campaign_id, :read])
    |> validate_required([:wallet_address, :type, :title])
    |> validate_inclusion(:type, @valid_types)
  end
end
