defmodule QadamBackendWeb.GovernanceController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Governance.ExtensionVote
  alias QadamBackend.Milestones.Milestone

  action_fallback QadamBackendWeb.FallbackController

  @doc "Get active votes for a campaign's milestones"
  def active_votes(conn, %{"campaign_id" => campaign_id}) do
    milestones =
      Milestone
      |> where([m], m.campaign_id == ^campaign_id and m.status in ["voting_active", "extension_requested"])
      |> Repo.all()

    data = Enum.map(milestones, fn m ->
      votes = Repo.all(from v in ExtensionVote, where: v.milestone_id == ^m.id)
      total_approve = Enum.filter(votes, & &1.vote_approve) |> Enum.map(& &1.voting_power) |> Enum.sum()
      total_reject = Enum.reject(votes, & &1.vote_approve) |> Enum.map(& &1.voting_power) |> Enum.sum()

      %{
        milestone_id: m.id,
        milestone_index: m.index,
        milestone_title: m.title,
        status: m.status,
        deadline: m.deadline,
        total_approve: total_approve,
        total_reject: total_reject,
        votes_count: length(votes),
      }
    end)

    json(conn, %{data: data})
  end

  @doc "Check if current user has voted on a milestone"
  def my_vote(conn, %{"milestone_id" => milestone_id}) do
    wallet = conn.assigns.current_wallet

    case Repo.get_by(ExtensionVote, milestone_id: milestone_id, voter_wallet: wallet) do
      nil -> json(conn, %{data: nil})
      vote -> json(conn, %{data: %{vote_approve: vote.vote_approve, voting_power: vote.voting_power}})
    end
  end
end
