defmodule QadamBackend.Reputation do
  @moduledoc """
  The Reputation context — manages creator reputation scores.
  """
  alias QadamBackend.Repo
  alias QadamBackend.Reputation.CreatorReputation

  def get_or_create(wallet_address) do
    case Repo.get_by(CreatorReputation, wallet_address: wallet_address) do
      nil ->
        %CreatorReputation{}
        |> CreatorReputation.changeset(%{wallet_address: wallet_address})
        |> Repo.insert()

      rep ->
        {:ok, rep}
    end
  end

  @doc """
  Recalculate reputation score based on events.
  Called by workers after milestone/campaign state changes.
  """
  def record_milestone_on_time(wallet_address) do
    with {:ok, rep} <- get_or_create(wallet_address) do
      new_on_time = (rep.milestones_on_time || 0) + 1
      new_score = min(100, (rep.score || 50) + 30)

      rep
      |> CreatorReputation.changeset(%{milestones_on_time: new_on_time, score: new_score})
      |> Repo.update()
    end
  end

  def record_milestone_late(wallet_address) do
    with {:ok, rep} <- get_or_create(wallet_address) do
      new_late = (rep.milestones_late || 0) + 1
      new_score = max(0, (rep.score || 50) - 20)

      rep
      |> CreatorReputation.changeset(%{milestones_late: new_late, score: new_score})
      |> Repo.update()
    end
  end

  def record_campaign_completed(wallet_address) do
    with {:ok, rep} <- get_or_create(wallet_address) do
      new_completed = (rep.campaigns_completed || 0) + 1
      new_score = min(100, (rep.score || 50) + 20)

      rep
      |> CreatorReputation.changeset(%{campaigns_completed: new_completed, score: new_score})
      |> Repo.update()
    end
  end

  def record_campaign_refunded(wallet_address) do
    with {:ok, rep} <- get_or_create(wallet_address) do
      new_refunded = (rep.campaigns_refunded || 0) + 1
      new_score = max(0, (rep.score || 50) - 30)

      rep
      |> CreatorReputation.changeset(%{campaigns_refunded: new_refunded, score: new_score})
      |> Repo.update()
    end
  end
end
