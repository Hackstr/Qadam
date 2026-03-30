defmodule QadamBackend.Repo.Migrations.CreateAiDecisions do
  use Ecto.Migration

  def change do
    create table(:ai_decisions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :milestone_id, references(:milestones, type: :binary_id, on_delete: :delete_all),
        null: false
      add :prompt_hash, :string
      add :response_hash, :string
      add :decision, :string, null: false
      add :explanation, :text
      add :claude_model, :string
      add :latency_ms, :integer
      add :solana_tx_signature, :string

      timestamps(type: :utc_datetime)
    end

    create index(:ai_decisions, [:milestone_id])
  end
end
