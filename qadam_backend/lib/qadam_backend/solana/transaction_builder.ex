defmodule QadamBackend.Solana.TransactionBuilder do
  @moduledoc """
  Builds and signs Solana transactions for the AI agent.
  Critical rule: ALWAYS fetch fresh blockhash before signing. Never cache.
  """
  alias QadamBackend.Solana.RPC

  @doc """
  Sign and broadcast a release_milestone transaction.
  Returns {:ok, signature} or {:error, reason}.
  """
  def sign_and_broadcast_release(campaign_pubkey, milestone_index, ai_decision_hash) do
    # 1. ALWAYS fresh blockhash (never cached — they expire in ~60 seconds)
    with {:ok, %{blockhash: blockhash}} <- RPC.get_latest_blockhash() do
      # 2. Build the transaction
      # NOTE: In production, this would construct the actual Solana transaction
      # using the Anchor program IDL. For now, this is a placeholder that
      # will be filled in when we integrate with @solana/web3.js via Port or NIF.
      tx_data = %{
        program_id: program_id(),
        instruction: "release_milestone",
        args: %{
          milestone_index: milestone_index,
          ai_decision_hash: ai_decision_hash
        },
        accounts: %{
          campaign: campaign_pubkey
        },
        blockhash: blockhash
      }

      # 3. Sign with AI agent keypair
      signed_tx = sign_transaction(tx_data)

      # 4. Broadcast
      RPC.send_transaction(signed_tx)
    end
  end

  @doc """
  Sign and broadcast mark_under_human_review transaction.
  """
  def sign_and_broadcast_human_review(campaign_pubkey, milestone_index, ai_decision_hash) do
    with {:ok, %{blockhash: _blockhash}} <- RPC.get_latest_blockhash() do
      # Placeholder — same pattern as release
      {:ok, %{signature: "placeholder_human_review_tx"}}
    end
  end

  defp program_id do
    Application.get_env(:qadam_backend, :solana_program_id)
  end

  defp sign_transaction(_tx_data) do
    # TODO: Implement actual Ed25519 signing with AI agent keypair
    # Options:
    # 1. Use Erlang :crypto.sign(:eddsa, ...) directly
    # 2. Shell out to a Node.js script using @solana/web3.js
    # 3. Use a Rust NIF for Solana transaction serialization
    #
    # For hackathon: option 2 (Node.js script) is fastest to implement
    "placeholder_signed_tx_base64"
  end
end
