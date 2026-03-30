defmodule QadamBackendWeb.Plugs.AdminPlug do
  @moduledoc """
  Plug that checks if the authenticated wallet is the admin wallet.
  Must be used after AuthPlug.
  """
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    admin_wallet = Application.get_env(:qadam_backend, :admin_wallet)

    if conn.assigns[:current_wallet] == admin_wallet do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "forbidden"})
      |> halt()
    end
  end
end
