defmodule QadamBackend.Repo.Migrations.CreateCompanionTables do
  use Ecto.Migration

  def change do
    create table(:companion_nudges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_wallet, :string, null: false
      add :title, :string, null: false
      add :body, :text, null: false
      add :primary_cta_label, :string
      add :primary_cta_action, :string
      add :generated_at, :utc_datetime, null: false
      add :dismissed_at, :utc_datetime
      add :read_at, :utc_datetime
      add :source_signals, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    create index(:companion_nudges, [:campaign_id])
    create index(:companion_nudges, [:creator_wallet, :read_at])

    create table(:companion_conversations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_wallet, :string, null: false
      add :started_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:companion_conversations, [:campaign_id, :creator_wallet])

    create table(:companion_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :conversation_id, references(:companion_conversations, type: :binary_id, on_delete: :delete_all), null: false
      add :role, :string, null: false  # "user" | "assistant"
      add :content, :text, null: false
      add :token_count, :integer

      timestamps(type: :utc_datetime)
    end

    create index(:companion_messages, [:conversation_id])
  end
end
