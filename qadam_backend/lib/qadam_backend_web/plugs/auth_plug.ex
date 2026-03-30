defmodule QadamBackendWeb.Plugs.AuthPlug do
  @moduledoc """
  Plug that extracts and verifies JWT from Authorization header.
  Sets `conn.assigns.current_wallet` on success.
  """
  import Plug.Conn
  alias QadamBackend.Auth.Token

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, wallet} <- Token.verify_token(token) do
      assign(conn, :current_wallet, wallet)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "unauthorized"})
        |> halt()
    end
  end
end
