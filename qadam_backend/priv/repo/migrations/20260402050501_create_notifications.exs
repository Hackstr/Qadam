defmodule QadamBackend.Repo.Migrations.CreateNotifications do
  use Ecto.Migration

  def change do
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :wallet_address, :string, null: false
      add :type, :string, null: false
      add :title, :string, null: false
      add :message, :string
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :nilify_all)
      add :read, :boolean, default: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:notifications, [:wallet_address, :read])
  end
end
