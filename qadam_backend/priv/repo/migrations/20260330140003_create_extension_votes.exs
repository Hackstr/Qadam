defmodule QadamBackend.Repo.Migrations.CreateExtensionVotes do
  use Ecto.Migration

  def change do
    create table(:extension_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :milestone_id, references(:milestones, type: :binary_id, on_delete: :delete_all),
        null: false
      add :voter_wallet, :string, null: false
      add :voting_power, :bigint, null: false
      add :vote_approve, :boolean, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:extension_votes, [:milestone_id])
    create unique_index(:extension_votes, [:milestone_id, :voter_wallet])
  end
end
