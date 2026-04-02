defmodule QadamBackendWeb.NotificationController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Notifications

  def index(conn, _params) do
    wallet = conn.assigns.current_wallet
    notifications = Notifications.list_for_wallet(wallet)
    unread = Notifications.unread_count(wallet)

    json(conn, %{
      data: Enum.map(notifications, &notification_json/1),
      unread_count: unread,
    })
  end

  def mark_read(conn, _params) do
    wallet = conn.assigns.current_wallet
    Notifications.mark_all_read(wallet)
    json(conn, %{ok: true})
  end

  defp notification_json(n) do
    %{
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      campaign_id: n.campaign_id,
      read: n.read,
      inserted_at: n.inserted_at,
    }
  end
end
