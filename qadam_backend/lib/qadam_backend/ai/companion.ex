defmodule QadamBackend.AI.Companion do
  @moduledoc """
  AI Companion context — manages nudges, conversations, and AI-powered helpers.
  """
  import Ecto.Query
  alias QadamBackend.Repo
  alias QadamBackend.AI.Companion.{Nudge, Conversation, Message}

  # ── Nudges ──

  def get_latest_nudge(campaign_id) do
    Nudge
    |> where([n], n.campaign_id == ^campaign_id and is_nil(n.dismissed_at))
    |> order_by(desc: :generated_at)
    |> limit(1)
    |> Repo.one()
  end

  def list_nudges_for_wallet(wallet) do
    Nudge
    |> where([n], n.creator_wallet == ^wallet and is_nil(n.dismissed_at))
    |> order_by(desc: :generated_at)
    |> limit(10)
    |> Repo.all()
  end

  def create_nudge(attrs) do
    %Nudge{}
    |> Nudge.changeset(attrs)
    |> Repo.insert()
  end

  def dismiss_nudge(nudge_id) do
    case Repo.get(Nudge, nudge_id) do
      nil -> {:error, :not_found}
      nudge -> nudge |> Nudge.changeset(%{dismissed_at: DateTime.utc_now()}) |> Repo.update()
    end
  end

  def mark_nudge_read(nudge_id) do
    case Repo.get(Nudge, nudge_id) do
      nil -> {:error, :not_found}
      nudge -> nudge |> Nudge.changeset(%{read_at: DateTime.utc_now()}) |> Repo.update()
    end
  end

  # ── Conversations ──

  def get_or_create_conversation(campaign_id, wallet) do
    case Repo.get_by(Conversation, campaign_id: campaign_id, creator_wallet: wallet) do
      nil ->
        %Conversation{}
        |> Conversation.changeset(%{
          campaign_id: campaign_id,
          creator_wallet: wallet,
          started_at: DateTime.utc_now()
        })
        |> Repo.insert()
      conv -> {:ok, conv}
    end
  end

  def get_conversation_with_messages(conversation_id) do
    Conversation
    |> Repo.get(conversation_id)
    |> Repo.preload(messages: from(m in Message, order_by: m.inserted_at, limit: 50))
  end

  def add_message(conversation_id, role, content, token_count \\ nil) do
    %Message{}
    |> Message.changeset(%{
      conversation_id: conversation_id,
      role: role,
      content: content,
      token_count: token_count
    })
    |> Repo.insert()
  end
end
