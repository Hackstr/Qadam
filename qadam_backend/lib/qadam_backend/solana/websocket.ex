defmodule QadamBackend.Solana.WebSocket do
  @moduledoc """
  WebSocket client for Solana program event subscription.
  Listens for program log events (MilestoneSubmitted, etc.) and dispatches to handlers.
  """
  use WebSockex
  require Logger

  @reconnect_interval 5_000

  def start_link(opts \\ []) do
    url = Application.get_env(:qadam_backend, :solana_ws_url, "wss://api.devnet.solana.com")
    WebSockex.start_link(url, __MODULE__, %{program_id: opts[:program_id]}, name: __MODULE__)
  end

  @impl true
  def handle_connect(_conn, state) do
    Logger.info("[SolanaWS] Connected to Solana WebSocket")
    subscribe_to_program(state.program_id)
    {:ok, state}
  end

  @impl true
  def handle_frame({:text, msg}, state) do
    case Jason.decode(msg) do
      {:ok, %{"method" => "logsNotification", "params" => params}} ->
        handle_log_notification(params)

      {:ok, %{"result" => subscription_id}} ->
        Logger.info("[SolanaWS] Subscribed with id: #{subscription_id}")

      {:ok, _other} ->
        :ok

      {:error, _} ->
        Logger.warning("[SolanaWS] Failed to parse message")
    end

    {:ok, state}
  end

  @impl true
  def handle_disconnect(%{reason: reason}, state) do
    Logger.warning("[SolanaWS] Disconnected: #{inspect(reason)}. Reconnecting in #{@reconnect_interval}ms...")
    Process.sleep(@reconnect_interval)
    {:reconnect, state}
  end

  # Private

  defp subscribe_to_program(program_id) when is_binary(program_id) do
    msg = Jason.encode!(%{
      jsonrpc: "2.0",
      id: 1,
      method: "logsSubscribe",
      params: [
        %{mentions: [program_id]},
        %{commitment: "confirmed"}
      ]
    })

    WebSockex.send_frame(__MODULE__, {:text, msg})
  end

  defp subscribe_to_program(_), do: :ok

  defp handle_log_notification(%{"result" => %{"value" => %{"logs" => logs, "signature" => sig}}}) do
    # Parse Anchor event discriminators from logs
    events = parse_anchor_events(logs)

    Enum.each(events, fn event ->
      Logger.info("[SolanaWS] Event: #{event.name} in tx #{sig}")
      dispatch_event(event, sig)
    end)
  end

  defp handle_log_notification(_), do: :ok

  defp parse_anchor_events(logs) do
    logs
    |> Enum.filter(&String.starts_with?(&1, "Program data: "))
    |> Enum.map(fn log ->
      data = String.replace_prefix(log, "Program data: ", "")

      case Base.decode64(data) do
        {:ok, bytes} -> parse_event_discriminator(bytes)
        :error -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp parse_event_discriminator(<<discriminator::binary-size(8), _rest::binary>>) do
    # For MVP: match known discriminators by first 8 bytes
    # Full Borsh parsing will be added when we integrate with specific events
    %{name: "program_event", discriminator: Base.encode16(discriminator, case: :lower)}
  end

  defp parse_event_discriminator(_), do: nil

  defp dispatch_event(%{name: "program_event", discriminator: disc} = _event, signature) do
    # Match known Anchor event discriminators and enqueue workers
    # Discriminators are first 8 bytes of SHA-256("event:<EventName>")
    case disc do
      # MilestoneSubmitted event → trigger AI verification
      disc when is_binary(disc) ->
        # For MVP: check if the log contains "MilestoneSubmitted" text
        # In production: match exact discriminator bytes from IDL
        Logger.info("[SolanaWS] Program event #{disc} in tx #{signature}")

        # Try to find milestone from the transaction logs
        # and enqueue AI verification worker
        case find_milestone_from_tx(signature) do
          {:ok, milestone_id} ->
            %{milestone_id: milestone_id}
            |> QadamBackend.Workers.AIVerificationWorker.new()
            |> Oban.insert()
            Logger.info("[SolanaWS] Enqueued AI verification for milestone #{milestone_id}")

          {:error, reason} ->
            Logger.debug("[SolanaWS] Could not find milestone for event: #{inspect(reason)}")
        end

      _ ->
        :ok
    end
  end

  defp find_milestone_from_tx(signature) do
    # Look up the transaction to find which milestone was submitted
    # In production this would parse the transaction accounts
    case QadamBackend.Solana.RPC.get_transaction(signature) do
      {:ok, {:ok, _tx}} ->
        # Parse accounts from transaction to find milestone PDA
        # For now, return error — the webhook/indexer approach is more reliable
        {:error, :parsing_not_implemented}

      _ ->
        {:error, :tx_not_found}
    end
  end
end
