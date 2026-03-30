defmodule QadamBackendWeb.AuthController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Auth.{WalletAuth, Token}

  def nonce(conn, _params) do
    challenge = WalletAuth.generate_challenge()
    json(conn, challenge)
  end

  def verify(conn, %{"pubkey" => pubkey, "signature" => signature, "message" => message}) do
    with :ok <- WalletAuth.validate_message_freshness(message),
         {:ok, wallet} <- WalletAuth.verify_signature(pubkey, signature, message),
         {:ok, token, _claims} <- Token.generate_for_wallet(wallet) do
      json(conn, %{token: token, wallet: wallet})
    else
      {:error, :invalid_signature} ->
        conn |> put_status(:unauthorized) |> json(%{error: "invalid_signature"})

      {:error, :nonce_expired} ->
        conn |> put_status(:unauthorized) |> json(%{error: "nonce_expired"})

      {:error, _reason} ->
        conn |> put_status(:bad_request) |> json(%{error: "verification_failed"})
    end
  end

  def verify(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "missing_params"})
  end
end
