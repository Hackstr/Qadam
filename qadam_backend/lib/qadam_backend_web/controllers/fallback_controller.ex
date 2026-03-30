defmodule QadamBackendWeb.FallbackController do
  @moduledoc """
  Centralized error handling for all controllers.
  Controllers return {:error, ...} tuples, this converts them to JSON responses.
  """
  use QadamBackendWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: QadamBackendWeb.ChangesetJSON)
    |> render(:error, changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: QadamBackendWeb.ErrorJSON)
    |> render(:"404")
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: QadamBackendWeb.ErrorJSON)
    |> render(:"401")
  end

  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: QadamBackendWeb.ErrorJSON)
    |> render(:"403")
  end

  def call(conn, {:error, {:invalid_transition, from, to}}) do
    conn
    |> put_status(:conflict)
    |> json(%{error: "invalid_state_transition", from: from, to: to})
  end

  def call(conn, {:error, reason}) when is_atom(reason) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: to_string(reason)})
  end
end
