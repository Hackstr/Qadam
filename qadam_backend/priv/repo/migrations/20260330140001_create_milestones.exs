defmodule QadamBackend.Repo.Migrations.CreateMilestones do
  use Ecto.Migration

  def change do
    create table(:milestones, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :delete_all),
        null: false
      add :index, :integer, null: false
      add :title, :string
      add :description, :text
      add :acceptance_criteria, :text
      add :amount_lamports, :bigint, null: false
      add :deadline, :utc_datetime, null: false
      add :grace_deadline, :utc_datetime
      add :extension_deadline, :utc_datetime
      add :status, :string, null: false, default: "pending"

      # Evidence
      add :evidence_text, :text
      add :evidence_links, {:array, :string}, default: []
      add :evidence_files, :map, default: %{}
      add :evidence_hash, :string

      # AI decision
      add :ai_decision, :string
      add :ai_explanation, :text
      add :ai_decision_hash, :string
      add :ai_solana_tx, :string

      add :submitted_at, :utc_datetime
      add :decided_at, :utc_datetime
      add :released_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:milestones, [:campaign_id])
    create unique_index(:milestones, [:campaign_id, :index])
  end
end
