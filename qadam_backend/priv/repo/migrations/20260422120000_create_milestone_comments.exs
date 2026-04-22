defmodule QadamBackend.Repo.Migrations.CreateMilestoneComments do
  use Ecto.Migration

  def change do
    create table(:milestone_comments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :milestone_id, references(:milestones, type: :binary_id, on_delete: :delete_all), null: false
      add :wallet_address, :string, null: false
      add :content, :text, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:milestone_comments, [:milestone_id])
  end
end
