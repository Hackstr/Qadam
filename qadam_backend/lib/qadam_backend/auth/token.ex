defmodule QadamBackend.Auth.Token do
  @moduledoc """
  JWT token generation and verification using Joken.
  """
  use Joken.Config

  @token_ttl_seconds 86400 * 7  # 7 days

  @impl true
  def token_config do
    default_claims(default_exp: @token_ttl_seconds)
  end

  @doc """
  Generate a JWT for an authenticated wallet.
  """
  def generate_for_wallet(wallet_address) do
    claims = %{
      "wallet" => wallet_address,
      "iat" => DateTime.utc_now() |> DateTime.to_unix()
    }

    generate_and_sign(claims)
  end

  @doc """
  Verify a JWT and extract the wallet address.
  """
  def verify_token(token) do
    case verify_and_validate(token) do
      {:ok, claims} -> {:ok, claims["wallet"]}
      {:error, reason} -> {:error, reason}
    end
  end
end
