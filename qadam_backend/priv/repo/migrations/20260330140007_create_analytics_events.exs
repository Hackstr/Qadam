defmodule QadamBackend.Repo.Migrations.CreateAnalyticsEvents do
  use Ecto.Migration

  def change do
    create table(:analytics_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :event_type, :string, null: false
      add :wallet_address, :string
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :nilify_all)
      add :properties, :map, default: %{}

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:analytics_events, [:event_type])
    create index(:analytics_events, [:campaign_id])
  end
end
