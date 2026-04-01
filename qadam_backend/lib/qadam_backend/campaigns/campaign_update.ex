defmodule QadamBackend.Campaigns.CampaignUpdate do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "campaign_updates" do
    field :author_wallet, :string
    field :title, :string
    field :content, :string

    belongs_to :campaign, QadamBackend.Campaigns.Campaign

    timestamps(type: :utc_datetime)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:campaign_id, :author_wallet, :title, :content])
    |> validate_required([:campaign_id, :author_wallet, :title, :content])
    |> validate_length(:title, max: 200)
    |> validate_length(:content, max: 5000)
  end
end
