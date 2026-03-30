defmodule QadamBackend.Workers.DeadlineMonitorWorker do
  @moduledoc """
  Oban cron worker: checks for overdue milestones every 5 minutes.
  Transitions Pending → GracePeriod → Failed based on deadline timestamps.
  """
  use Oban.Worker, queue: :deadline_monitor, max_attempts: 1

  alias QadamBackend.Milestones

  @impl Oban.Worker
  def perform(_job) do
    # Transition overdue pending → grace_period
    Milestones.get_overdue_milestones()
    |> Enum.each(fn milestone ->
      Milestones.transition_state(milestone, "grace_period", %{reason: "deadline_passed"})
    end)

    # Transition past-grace → failed
    Milestones.get_past_grace_milestones()
    |> Enum.each(fn milestone ->
      Milestones.transition_state(milestone, "failed", %{reason: "grace_period_expired"})
    end)

    :ok
  end
end
