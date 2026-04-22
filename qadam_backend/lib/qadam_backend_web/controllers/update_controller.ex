defmodule QadamBackendWeb.UpdateController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Campaigns

  action_fallback QadamBackendWeb.FallbackController

  def index(conn, %{"campaign_id" => campaign_id}) do
    updates = Campaigns.list_updates_for_campaign(campaign_id)
    json(conn, %{data: Enum.map(updates, &update_json/1)})
  end

  def create(conn, %{"campaign_id" => campaign_id} = params) do
    wallet = conn.assigns.current_wallet

    # Verify caller is the campaign creator
    case Campaigns.get_campaign!(campaign_id) do
      %{creator_wallet: ^wallet} = _campaign ->
        attrs = %{
          campaign_id: campaign_id,
          author_wallet: wallet,
          title: params["title"],
          content: params["content"]
        }

        case Campaigns.create_update(attrs) do
          {:ok, update} ->
            # Notify backers about update
            campaign = Campaigns.get_campaign!(campaign_id)
            QadamBackend.Notifications.Notify.notify_backers(campaign, "campaign_update",
              "New update from #{campaign.title}",
              update.title,
              %{update_title: update.title, update_content: update.content})

            conn |> put_status(:created) |> json(%{data: update_json(update)})

          {:error, changeset} -> {:error, changeset}
        end

      _ ->
        {:error, :forbidden}
    end
  end

  defp update_json(u) do
    %{
      id: u.id,
      campaign_id: u.campaign_id,
      author_wallet: u.author_wallet,
      title: u.title,
      content: u.content,
      inserted_at: u.inserted_at
    }
  end
end
