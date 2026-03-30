defmodule QadamBackend.Repo.Migrations.AddTokensPerLamportToCampaigns do
  use Ecto.Migration

  def change do
    alter table(:campaigns) do
      add :tokens_per_lamport, :bigint, default: 100
    end
  end
end
