defmodule QadamBackend.Repo.Migrations.CreateCampaigns do
  use Ecto.Migration

  def change do
    create table(:campaigns, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :solana_pubkey, :string, null: false
      add :creator_wallet, :string, null: false
      add :title, :string, null: false
      add :description, :text
      add :category, :string
      add :cover_image_url, :string
      add :pitch_video_url, :string
      add :goal_lamports, :bigint, null: false
      add :raised_lamports, :bigint, default: 0
      add :backers_count, :integer, default: 0
      add :token_mint_address, :string
      add :status, :string, null: false, default: "draft"
      add :milestones_count, :integer, null: false
      add :milestones_approved, :integer, default: 0
      add :featured, :boolean, default: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:campaigns, [:solana_pubkey])
    create index(:campaigns, [:creator_wallet])
    create index(:campaigns, [:status])
  end
end
