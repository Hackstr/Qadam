defmodule QadamBackend.Repo.Migrations.AddEmailVerificationToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :email_verified, :boolean, default: false
      add :email_verification_token, :string
      add :email_verification_sent_at, :utc_datetime
    end
  end
end
