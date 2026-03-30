defmodule QadamBackend.Auth.WalletAuth do
  @moduledoc """
  Sign In With Solana — Ed25519 signature verification.

  Flow:
  1. Client requests nonce via GET /api/auth/nonce
  2. Server returns a message with random nonce
  3. Client signs the message with Phantom/Solflare
  4. Client sends {pubkey, signature, message} to POST /api/auth/verify
  5. Server verifies Ed25519 signature and returns JWT
  """

  @nonce_ttl_seconds 300

  @doc """
  Generate a sign-in message with a random nonce.
  """
  def generate_challenge do
    nonce = :crypto.strong_rand_bytes(16) |> Base.encode16(case: :lower)
    issued_at = DateTime.utc_now() |> DateTime.to_iso8601()

    message = """
    Qadam wants you to sign in with your Solana account.

    Nonce: #{nonce}
    Issued At: #{issued_at}
    """

    %{message: String.trim(message), nonce: nonce, issued_at: issued_at}
  end

  @doc """
  Verify an Ed25519 signature from a Solana wallet.

  - `pubkey_b58` — Base58-encoded Solana public key (32 bytes)
  - `signature_b58` — Base58-encoded signature (64 bytes)
  - `message` — the exact message that was signed
  """
  def verify_signature(pubkey_b58, signature_b58, message) do
    with {:ok, pubkey_bytes} <- b58_decode(pubkey_b58),
         {:ok, signature_bytes} <- b58_decode(signature_b58),
         true <- byte_size(pubkey_bytes) == 32,
         true <- byte_size(signature_bytes) == 64 do
      message_bytes = message |> to_string()

      case :crypto.verify(:eddsa, :none, message_bytes, signature_bytes, [pubkey_bytes, :ed25519]) do
        true -> {:ok, pubkey_b58}
        false -> {:error, :invalid_signature}
      end
    else
      _ -> {:error, :invalid_input}
    end
  end

  @doc """
  Validate that the nonce in the message hasn't expired.
  """
  def validate_message_freshness(message) do
    case Regex.run(~r/Issued At: (.+)/, message) do
      [_, issued_at_str] ->
        case DateTime.from_iso8601(issued_at_str) do
          {:ok, issued_at, _} ->
            age = DateTime.diff(DateTime.utc_now(), issued_at, :second)

            if age <= @nonce_ttl_seconds do
              :ok
            else
              {:error, :nonce_expired}
            end

          _ ->
            {:error, :invalid_message}
        end

      _ ->
        {:error, :invalid_message}
    end
  end

  defp b58_decode(encoded) do
    try do
      {:ok, Base58.decode(encoded)}
    rescue
      _ -> {:error, :invalid_base58}
    end
  end
end
