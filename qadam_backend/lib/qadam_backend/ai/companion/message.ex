defmodule QadamBackend.AI.Companion.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "companion_messages" do
    field :role, :string  # "user" | "assistant"
    field :content, :string
    field :token_count, :integer

    belongs_to :conversation, QadamBackend.AI.Companion.Conversation

    timestamps(type: :utc_datetime)
  end

  def changeset(msg, attrs) do
    msg
    |> cast(attrs, [:conversation_id, :role, :content, :token_count])
    |> validate_required([:conversation_id, :role, :content])
    |> validate_inclusion(:role, ["user", "assistant"])
  end
end
