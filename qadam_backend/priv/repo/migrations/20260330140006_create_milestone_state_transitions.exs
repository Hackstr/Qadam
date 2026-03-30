defmodule QadamBackend.Repo.Migrations.CreateMilestoneStateTransitions do
  use Ecto.Migration

  def change do
    create table(:milestone_state_transitions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :milestone_id, references(:milestones, type: :binary_id, on_delete: :delete_all),
        null: false
      add :from_state, :string, null: false
      add :to_state, :string, null: false
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:milestone_state_transitions, [:milestone_id])
  end
end
