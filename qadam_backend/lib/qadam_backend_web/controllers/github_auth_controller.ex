defmodule QadamBackendWeb.GithubAuthController do
  @moduledoc "GitHub OAuth for creator verification"
  use QadamBackendWeb, :controller

  alias QadamBackend.Accounts
  require Logger

  @github_authorize_url "https://github.com/login/oauth/authorize"
  @github_token_url "https://github.com/login/oauth/access_token"
  @github_user_url "https://api.github.com/user"

  @doc "Redirect user to GitHub OAuth. Frontend opens this URL."
  def authorize(conn, _params) do
    client_id = System.get_env("GITHUB_CLIENT_ID")
    redirect_uri = System.get_env("GITHUB_REDIRECT_URI")

    if is_nil(client_id) do
      conn |> put_status(:service_unavailable) |> json(%{error: "GitHub OAuth not configured"})
    else
      url = "#{@github_authorize_url}?client_id=#{client_id}&redirect_uri=#{URI.encode(redirect_uri)}&scope=read:user"
      json(conn, %{url: url})
    end
  end

  @doc "GitHub redirects here with ?code=xxx. Exchange for access token, fetch username."
  def callback(conn, %{"code" => code}) do
    wallet = conn.assigns.current_wallet
    client_id = System.get_env("GITHUB_CLIENT_ID")
    client_secret = System.get_env("GITHUB_CLIENT_SECRET")

    with {:ok, access_token} <- exchange_code(code, client_id, client_secret),
         {:ok, github_username} <- fetch_github_user(access_token),
         user when not is_nil(user) <- Accounts.get_user_by_wallet(wallet),
         {:ok, updated} <- Accounts.update_user(user, %{
           github_username: github_username,
           github_verified: true
         }) do
      json(conn, %{data: %{github_username: updated.github_username, github_verified: true}})
    else
      {:error, reason} ->
        Logger.error("[GitHub] OAuth failed: #{inspect(reason)}")
        conn |> put_status(:bad_request) |> json(%{error: "GitHub verification failed"})

      nil ->
        conn |> put_status(:not_found) |> json(%{error: "User not found"})
    end
  end

  def callback(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Missing code parameter"})
  end

  defp exchange_code(code, client_id, client_secret) do
    body = Jason.encode!(%{
      client_id: client_id,
      client_secret: client_secret,
      code: code
    })

    case Req.post(@github_token_url, body: body, headers: [
      {"content-type", "application/json"},
      {"accept", "application/json"}
    ]) do
      {:ok, %{status: 200, body: %{"access_token" => token}}} ->
        {:ok, token}

      {:ok, %{body: body}} ->
        {:error, {:github_token_error, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_github_user(access_token) do
    case Req.get(@github_user_url, headers: [
      {"authorization", "Bearer #{access_token}"},
      {"accept", "application/json"}
    ]) do
      {:ok, %{status: 200, body: %{"login" => username}}} ->
        {:ok, username}

      {:ok, %{body: body}} ->
        {:error, {:github_user_error, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end
end
