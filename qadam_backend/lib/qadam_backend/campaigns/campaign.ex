defmodule QadamBackend.Campaigns.Campaign do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "campaigns" do
    field :solana_pubkey, :string
    field :creator_wallet, :string
    field :title, :string
    field :description, :string
    field :category, :string
    field :cover_image_url, :string
    field :pitch_video_url, :string
    field :goal_lamports, :integer
    field :raised_lamports, :integer, default: 0
    field :backers_count, :integer, default: 0
    field :token_mint_address, :string
    field :status, :string, default: "draft"
    field :milestones_count, :integer
    field :milestones_approved, :integer, default: 0
    field :tokens_per_lamport, :integer, default: 100
    field :featured, :boolean, default: false

    has_many :milestones, QadamBackend.Milestones.Milestone
    has_many :backer_positions, QadamBackend.Backers.BackerPosition

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(solana_pubkey creator_wallet title goal_lamports milestones_count status)a
  @optional_fields ~w(description category cover_image_url pitch_video_url
                      raised_lamports backers_count token_mint_address
                      tokens_per_lamport milestones_approved featured)a

  def changeset(campaign, attrs) do
    campaign
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, ~w(draft active completed refunded paused cancelled))
    |> unique_constraint(:solana_pubkey)
  end
end
