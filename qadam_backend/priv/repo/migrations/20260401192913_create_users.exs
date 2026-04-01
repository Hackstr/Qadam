defmodule QadamBackend.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :wallet_address, :string, null: false
      add :display_name, :string
      add :email, :string
      add :avatar_url, :string

      # Notification preferences
      add :notify_milestone_approved, :boolean, default: true
      add :notify_milestone_rejected, :boolean, default: true
      add :notify_governance_vote, :boolean, default: true
      add :notify_refund_available, :boolean, default: true
      add :notify_campaign_updates, :boolean, default: true

      # Verification
      add :github_username, :string
      add :github_verified, :boolean, default: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:wallet_address])
    create unique_index(:users, [:email], where: "email IS NOT NULL")
  end
end
