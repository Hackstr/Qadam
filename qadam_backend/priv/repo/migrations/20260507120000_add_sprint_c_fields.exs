defmodule QadamBackend.Repo.Migrations.AddSprintCFields do
  use Ecto.Migration

  def change do
    alter table(:campaigns) do
      add :faq, {:array, :map}, default: []
      add :gallery_urls, {:array, :string}, default: []
      add :accent_color, :string
    end
  end
end
