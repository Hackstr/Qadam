defmodule QadamBackendWeb.CommentController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Milestones.Comment

  def index(conn, %{"milestone_id" => milestone_id}) do
    comments =
      Comment
      |> where([c], c.milestone_id == ^milestone_id)
      |> order_by(asc: :inserted_at)
      |> Repo.all()

    # Enrich with display names
    wallets = Enum.map(comments, & &1.wallet_address) |> Enum.uniq()
    users = Repo.all(
      from(u in QadamBackend.Accounts.User,
        where: u.wallet_address in ^wallets,
        select: {u.wallet_address, u.display_name})
    ) |> Map.new()

    json(conn, %{
      data: Enum.map(comments, fn c ->
        %{
          id: c.id,
          wallet_address: c.wallet_address,
          display_name: Map.get(users, c.wallet_address),
          content: c.content,
          inserted_at: c.inserted_at,
        }
      end)
    })
  end

  def create(conn, %{"milestone_id" => milestone_id, "content" => content}) do
    wallet = conn.assigns.current_wallet

    case Repo.insert(Comment.changeset(%Comment{}, %{
      milestone_id: milestone_id,
      wallet_address: wallet,
      content: content,
    })) do
      {:ok, comment} ->
        conn |> put_status(:created) |> json(%{data: %{id: comment.id}})
      {:error, changeset} ->
        {:error, changeset}
    end
  end

  def create(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Missing content"})
  end
end
