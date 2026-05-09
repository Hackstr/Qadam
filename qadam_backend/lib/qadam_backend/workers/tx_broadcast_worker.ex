defmodule QadamBackend.Workers.TxBroadcastWorker do
  @moduledoc """
  Oban worker: signs and broadcasts Solana transactions.
  CRITICAL: Always fetches FRESH blockhash before signing (never cached).

  Note: Post Block 1, most on-chain actions are user-signed (cast_vote,
  resolve_vote). This worker handles backend-initiated transactions only
  (e.g. execute_extension_result for deadline-triggered extensions).
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

    milestone = Milestones.get_milestone!(milestone_id) |> Repo.preload(:campaign)
    campaign = milestone.campaign

    Logger.info("[TX] Broadcasting #{instruction} for milestone #{milestone_id}")

    result =
      case instruction do
        "execute_extension_result" ->
          TransactionBuilder.sign_and_broadcast_execute_extension(
            campaign.solana_pubkey,
            milestone.index
          )

        other ->
          Logger.warning("[TX] Unknown instruction: #{other}")
          {:error, :unknown_instruction}
      end

    case result do
      {:ok, %{signature: signature}} ->
        Logger.info("[TX] Broadcast success: #{signature}")

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
