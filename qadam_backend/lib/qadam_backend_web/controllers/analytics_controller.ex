defmodule QadamBackendWeb.AnalyticsController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.Backers.BackerPosition

  def summary(conn, _params) do
    total_campaigns = Repo.aggregate(Campaign, :count)
    active_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "active"), :count)
    completed_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "completed"), :count)
    total_raised = Repo.aggregate(Campaign, :sum, :raised_lamports) || 0
    total_backers = Repo.aggregate(BackerPosition, :count)

    # Success rate
    success_rate = if total_campaigns > 0 do
      round(completed_campaigns / total_campaigns * 100)
    else
      0
    end

    json(conn, %{
      data: %{
        total_campaigns: total_campaigns,
        active_campaigns: active_campaigns,
        completed_campaigns: completed_campaigns,
        total_raised_lamports: total_raised,
        total_backers: total_backers,
        success_rate: success_rate,
      }
    })
  end
end
