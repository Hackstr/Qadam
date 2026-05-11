defmodule QadamBackendWeb.Plugs.AdminPlug do
  @moduledoc """
  Plug that checks if the authenticated wallet is in the admin whitelist.
  Must be used after AuthPlug.

  Configure via ADMIN_WALLETS env var (comma-separated Solana pubkeys).
  Falls back to ADMIN_WALLET for backward compatibility.
  """
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    admin_wallets = Application.get_env(:qadam_backend, :admin_wallets, [])
    current_wallet = conn.assigns[:current_wallet]

    if current_wallet && current_wallet in admin_wallets do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "forbidden"})
      |> halt()
    end
  end
end
