defmodule QadamBackend.Notifications do
  @moduledoc """
  The Notifications context.
  """
  import Ecto.Query
  alias QadamBackend.Repo
  alias QadamBackend.Notifications.Notification

  def list_for_wallet(wallet_address, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)

    Notification
    |> where([n], n.wallet_address == ^wallet_address)
    |> order_by(desc: :inserted_at)
    |> limit(^limit)
    |> Repo.all()
  end

  def unread_count(wallet_address) do
    Notification
    |> where([n], n.wallet_address == ^wallet_address and n.read == false)
    |> Repo.aggregate(:count)
  end

  def mark_all_read(wallet_address) do
    Notification
    |> where([n], n.wallet_address == ^wallet_address and n.read == false)
    |> Repo.update_all(set: [read: true])
  end

  def create(attrs) do
    %Notification{}
    |> Notification.changeset(attrs)
    |> Repo.insert()
  end
end
