defmodule QadamBackend.Solana.TransactionBuilder do
  @moduledoc """
  Builds and signs Solana transactions for the AI agent.
  Uses a Node.js helper script for Anchor transaction serialization.
  CRITICAL: Always fetches FRESH blockhash before signing.
  """
  alias QadamBackend.Solana.RPC
  require Logger

  @doc """
  Sign and broadcast a release_milestone transaction.
  """
  def sign_and_broadcast_release(campaign_pubkey, milestone_index, ai_decision_hash) do
    with {:ok, %{blockhash: blockhash}} <- RPC.get_latest_blockhash(),
         {:ok, signed_tx} <- build_and_sign_tx("release_milestone", %{
           campaign: campaign_pubkey,
           milestone_index: milestone_index,
           ai_decision_hash: ai_decision_hash,
           blockhash: blockhash,
         }),
         {:ok, result} <- RPC.send_transaction(signed_tx) do
      {:ok, result}
    else
      {:error, reason} ->
        Logger.error("[TX] Release failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Sign and broadcast mark_under_human_review transaction.
  """
  def sign_and_broadcast_human_review(campaign_pubkey, milestone_index, ai_decision_hash) do
    with {:ok, %{blockhash: blockhash}} <- RPC.get_latest_blockhash(),
         {:ok, signed_tx} <- build_and_sign_tx("mark_under_human_review", %{
           campaign: campaign_pubkey,
           milestone_index: milestone_index,
           ai_decision_hash: ai_decision_hash,
           blockhash: blockhash,
         }),
         {:ok, result} <- RPC.send_transaction(signed_tx) do
      {:ok, result}
    else
      {:error, reason} ->
        Logger.error("[TX] Human review failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Sign and broadcast execute_extension_result transaction.
  """
  def sign_and_broadcast_execute_extension(campaign_pubkey, milestone_index) do
    with {:ok, %{blockhash: blockhash}} <- RPC.get_latest_blockhash(),
         {:ok, signed_tx} <- build_and_sign_tx("execute_extension_result", %{
           campaign: campaign_pubkey,
           milestone_index: milestone_index,
           blockhash: blockhash,
         }),
         {:ok, result} <- RPC.send_transaction(signed_tx) do
      {:ok, result}
    else
      {:error, reason} ->
        Logger.error("[TX] Execute extension failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp build_and_sign_tx(instruction, params) do
    keypair_path = System.get_env("AI_AGENT_KEYPAIR_PATH")
    program_id = Application.get_env(:qadam_backend, :solana_program_id)
    rpc_url = Application.get_env(:qadam_backend, :solana_rpc_url)

    if is_nil(keypair_path) or is_nil(program_id) do
      Logger.warning("[TX] AI_AGENT_KEYPAIR_PATH or SOLANA_PROGRAM_ID not set")
      {:error, :missing_config}
    else
      args = Jason.encode!(%{
        instruction: instruction,
        params: params,
        programId: program_id,
        rpcUrl: rpc_url,
        keypairPath: keypair_path,
      })

      script = sign_script_path()

      if File.exists?(script) do
        script_dir = Path.dirname(script)
        case System.cmd("node", [script, args], stderr_to_stdout: true, cd: script_dir) do
          {output, 0} ->
            case Jason.decode(String.trim(output)) do
              {:ok, %{"signedTx" => signed_tx}} -> {:ok, signed_tx}
              {:ok, %{"error" => error}} -> {:error, error}
              _ -> {:error, {:invalid_output, output}}
            end

          {output, code} ->
            Logger.error("[TX] Node script exit #{code}: #{output}")
            {:error, {:script_failed, code}}
        end
      else
        Logger.warning("[TX] Sign script not found at #{script}")
        {:error, :script_not_found}
      end
    end
  end

  defp sign_script_path do
    Path.join(:code.priv_dir(:qadam_backend), "solana/sign_transaction.js")
  end
end
