defmodule QadamBackend.Repo.Migrations.CreateCreatorReputations do
  use Ecto.Migration

  def change do
    create table(:creator_reputations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :wallet_address, :string, null: false
      add :score, :integer, default: 50
      add :milestones_on_time, :integer, default: 0
      add :milestones_late, :integer, default: 0
      add :campaigns_completed, :integer, default: 0
      add :campaigns_refunded, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:creator_reputations, [:wallet_address])
  end
end
