defmodule QadamBackend.Workers.TxConfirmationWorker do
  @moduledoc """
  Oban worker: polls for Solana transaction confirmation.
  Uses {:snooze, 2} to retry every 2 seconds until confirmed.
  """
  use Oban.Worker,
    queue: :solana_tx,
    max_attempts: 30

  alias QadamBackend.{Milestones, Repo}
  alias QadamBackend.Solana.RPC

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"milestone_id" => milestone_id, "signature" => signature}}) do
    milestone = Milestones.get_milestone!(milestone_id) |> Repo.preload(:campaign)

    case RPC.get_transaction(signature) do
      {:ok, {:ok, _tx_result}} ->
        # Transaction confirmed
        Logger.info("[TX] Confirmed: #{signature}")

        Milestones.update_milestone(milestone, %{
          released_at: DateTime.utc_now(),
          decided_at: milestone.decided_at || DateTime.utc_now()
        })

        {:ok, :confirmed}

      {:ok, {:error, :not_found}} ->
        # Not confirmed yet — snooze and retry in 2 seconds
        Logger.debug("[TX] Awaiting confirmation: #{signature}")
        {:snooze, 2}

      {:error, reason} ->
        Logger.error("[TX] Confirmation check failed: #{inspect(reason)}")
        {:snooze, 5}
    end
  end
end
