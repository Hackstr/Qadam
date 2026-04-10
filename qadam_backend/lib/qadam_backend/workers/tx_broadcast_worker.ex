defmodule QadamBackend.Workers.TxBroadcastWorker do
  @moduledoc """
  Oban worker: signs and broadcasts Solana transactions.
  CRITICAL: Always fetches FRESH blockhash before signing (never cached).
  """
  use Oban.Worker,
    queue: :solana_tx,
    max_attempts: 5

  alias QadamBackend.{Milestones, Repo}
  alias QadamBackend.Solana.TransactionBuilder
  alias QadamBackend.Workers.TxConfirmationWorker

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    milestone_id = args["milestone_id"]
    instruction = args["instruction"]
    ai_decision_hash = args["ai_decision_hash"]

    milestone = Milestones.get_milestone!(milestone_id) |> Repo.preload(:campaign)
    campaign = milestone.campaign

    Logger.info("[TX] Broadcasting #{instruction} for milestone #{milestone_id}")

    result =
      case instruction do
        "release_milestone" ->
          TransactionBuilder.sign_and_broadcast_release(
            campaign.solana_pubkey,
            milestone.index,
            ai_decision_hash
          )

        "mark_under_human_review" ->
          TransactionBuilder.sign_and_broadcast_human_review(
            campaign.solana_pubkey,
            milestone.index,
            ai_decision_hash
          )

        "admin_override_decision" ->
          TransactionBuilder.sign_and_broadcast_release(
            campaign.solana_pubkey,
            milestone.index,
            ai_decision_hash
          )

        "execute_extension_result" ->
          TransactionBuilder.sign_and_broadcast_execute_extension(
            campaign.solana_pubkey,
            milestone.index
          )
      end

    case result do
      {:ok, %{signature: signature}} ->
        Logger.info("[TX] Broadcast success: #{signature}")

        Milestones.update_milestone(milestone, %{ai_solana_tx: signature})

        # Enqueue confirmation checker
        %{milestone_id: milestone_id, signature: signature}
        |> TxConfirmationWorker.new()
        |> Oban.insert()

        {:ok, signature}

      {:error, reason} ->
        Logger.error("[TX] Broadcast failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
end
