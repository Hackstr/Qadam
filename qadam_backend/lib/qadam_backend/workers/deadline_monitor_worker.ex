defmodule QadamBackend.Workers.DeadlineMonitorWorker do
  @moduledoc """
  Oban cron worker: checks for overdue milestones every 5 minutes.
  Transitions Pending → GracePeriod → Failed based on deadline timestamps.
  """
  use Oban.Worker, queue: :deadline_monitor, max_attempts: 1

  import Ecto.Query
  alias QadamBackend.{Repo, Milestones}
  alias QadamBackend.Workers.TxBroadcastWorker
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

    # 3. Check for expired voting periods → auto-execute extension result
    # Find milestones in voting_active where voting deadline has passed
    now = DateTime.utc_now()
    expired_votes =
      QadamBackend.Milestones.Milestone
      |> where([m], m.status == "voting_active")
      |> Repo.all()
      |> Enum.filter(fn m ->
        # Check if voting deadline has passed
        # Voting state stores deadline — for now use milestone extension_deadline
        m.extension_deadline && DateTime.compare(m.extension_deadline, now) == :lt
      end)

    Enum.each(expired_votes, fn milestone ->
      Logger.info("[DeadlineMonitor] Voting expired for milestone #{milestone.id} — executing extension result on-chain")

      # Enqueue on-chain execute_extension_result transaction
      # The on-chain program determines outcome (extend or refund) based on votes
      %{
        milestone_id: milestone.id,
        instruction: "execute_extension_result",
        ai_decision_hash: nil
      }
      |> TxBroadcastWorker.new()
      |> Oban.insert()
    end)

    :ok
  end
end
