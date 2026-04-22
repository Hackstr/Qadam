defmodule QadamBackend.Milestones.Comment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "milestone_comments" do
    field :wallet_address, :string
    field :content, :string

    belongs_to :milestone, QadamBackend.Milestones.Milestone

    timestamps(type: :utc_datetime)
  end

  def changeset(comment, attrs) do
    comment
    |> cast(attrs, [:milestone_id, :wallet_address, :content])
    |> validate_required([:milestone_id, :wallet_address, :content])
    |> validate_length(:content, min: 1, max: 1000)
  end
end
