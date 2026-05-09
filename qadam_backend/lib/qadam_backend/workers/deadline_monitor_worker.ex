defmodule QadamBackend.Workers.DeadlineMonitorWorker do
  @moduledoc """
  Oban cron worker: checks for overdue milestones every 5 minutes.
  - Transitions Pending → GracePeriod → Failed based on deadline timestamps.
  - Auto-resolves expired votes (voting_active past vote_period_days).
  """
  use Oban.Worker, queue: :deadline_monitor, max_attempts: 1

  import Ecto.Query
  alias QadamBackend.{Repo, Milestones}
  require Logger

  @impl Oban.Worker
  def perform(_job) do
    # 1. Transition overdue pending → grace_period
    Milestones.get_overdue_milestones()
    |> Enum.each(fn milestone ->
      Milestones.transition_state(milestone, "grace_period", %{reason: "deadline_passed"})
    end)

    # 2. Transition past-grace → failed
    Milestones.get_past_grace_milestones()
    |> Enum.each(fn milestone ->
      Milestones.transition_state(milestone, "failed", %{reason: "grace_period_expired"})
    end)

    # 3. Auto-resolve expired votes
    # Post Block 1: resolve_vote is permissionless on-chain. Anyone can call it.
    # Backend auto-resolves in DB by transitioning milestone to approved (apathy default)
    # or checking vote data from frontend sync.
    # For now: milestones stuck in voting_active past deadline → approve (apathy default)
    now = DateTime.utc_now()
    expired_votes =
      QadamBackend.Milestones.Milestone
      |> where([m], m.status == "voting_active")
      |> Repo.all()
      |> Repo.preload(:campaign)
      |> Enum.filter(fn m ->
        # Vote period = campaign.vote_period_days from submission date
        vote_period = (m.campaign && m.campaign.vote_period_days) || 7
        vote_deadline = DateTime.add(m.submitted_at || m.updated_at, vote_period * 86400, :second)
        DateTime.compare(vote_deadline, now) == :lt
      end)

    Enum.each(expired_votes, fn milestone ->
      Logger.info("[DeadlineMonitor] Vote expired for milestone #{milestone.id} — auto-approving (apathy default)")

      # Apathy default: if no votes or on-chain resolution pending, approve
      # Real resolution happens on-chain via resolve_vote (anyone can call)
      # DB tracks the state for display purposes
      case Milestones.transition_state(milestone, "approved", %{reason: "vote_expired_apathy_default"}) do
        {:ok, _} ->
          try do
            QadamBackend.Notifications.Notify.notify_backers(
              milestone.campaign, "milestone_approved",
              "Milestone #{milestone.index + 1} approved",
              "Voting period ended. Milestone approved."
            )
          rescue
            _ -> :ok
          end
        {:error, _} ->
          Logger.warning("[DeadlineMonitor] Could not transition milestone #{milestone.id}")
      end
    end)

    :ok
  end
end
