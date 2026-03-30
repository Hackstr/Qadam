defmodule QadamBackend.Solana.RPC do
  @moduledoc """
  Thin HTTP client for Solana JSON-RPC.
  Uses Req for HTTP requests.
  """

  def rpc_url do
    Application.get_env(:qadam_backend, :solana_rpc_url, "https://api.devnet.solana.com")
  end

  @doc "Get latest blockhash — MUST be called fresh before every transaction signing"
  def get_latest_blockhash do
    call("getLatestBlockhash", [%{commitment: "finalized"}])
    |> extract_result(fn result ->
      %{
        blockhash: result["value"]["blockhash"],
        last_valid_block_height: result["value"]["lastValidBlockHeight"]
      }
    end)
  end

  @doc "Send a signed transaction"
  def send_transaction(signed_tx_base64) do
    call("sendTransaction", [signed_tx_base64, %{encoding: "base64", skipPreflight: false}])
    |> extract_result(fn signature -> %{signature: signature} end)
  end

  @doc "Get transaction status/confirmation"
  def get_transaction(signature) do
    call("getTransaction", [signature, %{encoding: "json", commitment: "confirmed"}])
    |> extract_result(fn
      nil -> {:error, :not_found}
      result -> {:ok, result}
    end)
  end

  @doc "Get account info (for reading on-chain state)"
  def get_account_info(pubkey) do
    call("getAccountInfo", [pubkey, %{encoding: "base64", commitment: "confirmed"}])
    |> extract_result(fn result -> result end)
  end

  @doc "Request airdrop (devnet only)"
  def request_airdrop(pubkey, lamports) do
    call("requestAirdrop", [pubkey, lamports])
  end

  # Private

  defp call(method, params) do
    body = %{
      jsonrpc: "2.0",
      id: 1,
      method: method,
      params: params
    }

    case Req.post(rpc_url(), json: body) do
      {:ok, %{status: 200, body: %{"result" => result}}} ->
        {:ok, result}

      {:ok, %{status: 200, body: %{"error" => error}}} ->
        {:error, {:rpc_error, error}}

      {:ok, %{status: status}} ->
        {:error, {:http_error, status}}

      {:error, reason} ->
        {:error, {:connection_error, reason}}
    end
  end

  defp extract_result({:ok, result}, transform) do
    case transform.(result) do
      {:error, _} = err -> err
      {:ok, _} = ok -> ok
      value -> {:ok, value}
    end
  end

  defp extract_result({:error, _} = error, _transform), do: error
end
