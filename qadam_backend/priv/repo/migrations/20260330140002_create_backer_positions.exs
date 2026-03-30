defmodule QadamBackend.Repo.Migrations.CreateBackerPositions do
  use Ecto.Migration

  def change do
    create table(:backer_positions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :delete_all),
        null: false
      add :wallet_address, :string, null: false
      add :amount_lamports, :bigint, null: false
      add :tokens_allocated, :bigint, null: false
      add :tokens_claimed, :bigint, default: 0
      add :tier, :integer, null: false
      add :refund_claimed, :boolean, default: false

      timestamps(type: :utc_datetime)
    end

    create index(:backer_positions, [:campaign_id])
    create index(:backer_positions, [:wallet_address])
    create unique_index(:backer_positions, [:campaign_id, :wallet_address])
  end
end
