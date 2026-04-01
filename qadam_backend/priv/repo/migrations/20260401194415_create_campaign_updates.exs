defmodule QadamBackend.Repo.Migrations.CreateCampaignUpdates do
  use Ecto.Migration

  def change do
    create table(:campaign_updates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :delete_all),
        null: false
      add :author_wallet, :string, null: false
      add :title, :string, null: false
      add :content, :text, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:campaign_updates, [:campaign_id])
  end
end
