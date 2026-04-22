defmodule QadamBackend.Notifications.Notify do
  @moduledoc """
  Helper to enqueue notification jobs for common events.
  Call these from controllers/workers when events happen.
  """
  import Ecto.Query
  alias QadamBackend.{Repo, Backers}
  alias QadamBackend.Workers.NotificationWorker

  @doc "Notify all backers of a campaign about a milestone event"
  def notify_backers(campaign, type, title, message \\ nil, extra \\ %{}) do
    positions = Backers.list_positions_for_campaign(campaign.id)

    for pos <- positions do
      %{
        wallet_address: pos.wallet_address,
        type: type,
        title: title,
        message: message,
        campaign_id: campaign.id,
        campaign_title: campaign.title,
      }
      |> Map.merge(extra)
      |> NotificationWorker.new()
      |> Oban.insert()
    end
  end

  @doc "Notify the creator of a campaign"
  def notify_creator(campaign, type, title, message \\ nil, extra \\ %{}) do
    %{
      wallet_address: campaign.creator_wallet,
      type: type,
      title: title,
      message: message,
      campaign_id: campaign.id,
      campaign_title: campaign.title,
    }
    |> Map.merge(extra)
    |> NotificationWorker.new()
    |> Oban.insert()
  end
end
