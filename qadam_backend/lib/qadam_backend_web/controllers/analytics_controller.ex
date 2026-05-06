defmodule QadamBackendWeb.AnalyticsController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.Backers.BackerPosition
  alias QadamBackend.Milestones.Milestone
  alias QadamBackend.Milestones.StateTransition

  def summary(conn, _params) do
    total_campaigns = Repo.aggregate(Campaign, :count)
    active_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "active"), :count)
    completed_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "completed"), :count)
    total_raised = Repo.aggregate(Campaign, :sum, :raised_lamports) || 0
    total_backers = Repo.aggregate(BackerPosition, :count)

    # Milestones stats
    total_milestones = Repo.aggregate(Milestone, :count)
    approved_milestones = Repo.aggregate(from(m in Milestone, where: m.status == "approved"), :count)
    voting_active = Repo.aggregate(from(m in Milestone, where: m.status == "voting_active"), :count)

    # New backers in last 30 days
    thirty_days_ago = DateTime.utc_now() |> DateTime.add(-30, :day)
    new_backers_30d = Repo.aggregate(
      from(b in BackerPosition, where: b.inserted_at >= ^thirty_days_ago),
      :count
    )

    # SOL currently in escrow (active campaigns)
    sol_in_escrow = Repo.aggregate(
      from(c in Campaign, where: c.status in ["active", "funded", "in_progress"]),
      :sum, :raised_lamports
    ) || 0

    json(conn, %{
      data: %{
        total_campaigns: total_campaigns,
        active_campaigns: active_campaigns,
        completed_campaigns: completed_campaigns,
        total_raised_lamports: total_raised,
        total_backers: total_backers,
        total_milestones: total_milestones,
        approved_milestones: approved_milestones,
        voting_active: voting_active,
        new_backers_30d: new_backers_30d,
        sol_in_escrow: sol_in_escrow,
      }
    })
  end

  @doc "GET /api/analytics/categories — campaign count + raised per category"
  def categories(conn, _params) do
    results =
      from(c in Campaign,
        where: not is_nil(c.category),
        group_by: c.category,
        select: %{
          category: c.category,
          count: count(c.id),
          raised_lamports: coalesce(sum(c.raised_lamports), 0)
        },
        order_by: [desc: count(c.id)]
      )
      |> Repo.all()

    json(conn, %{data: results})
  end

  @doc "GET /api/analytics/activity — recent platform activity from state transitions + campaign launches"
  def activity(conn, params) do
    limit = min(String.to_integer(Map.get(params, "limit", "20")), 50)

    # Get recent milestone state transitions with campaign info
    transitions =
      from(t in StateTransition,
        join: m in Milestone, on: m.id == t.milestone_id,
        join: c in Campaign, on: c.id == m.campaign_id,
        order_by: [desc: t.inserted_at],
        limit: ^limit,
        select: %{
          id: t.id,
          type: "milestone_transition",
          from_state: t.from_state,
          to_state: t.to_state,
          milestone_index: m.index,
          milestone_title: m.title,
          campaign_id: c.id,
          campaign_title: c.title,
          category: c.category,
          metadata: t.metadata,
          timestamp: t.inserted_at
        }
      )
      |> Repo.all()

    # Get recent campaign launches
    launches =
      from(c in Campaign,
        where: not is_nil(c.launched_at),
        order_by: [desc: c.launched_at],
        limit: ^limit,
        select: %{
          id: c.id,
          type: "campaign_launched",
          campaign_id: c.id,
          campaign_title: c.title,
          category: c.category,
          goal_lamports: c.goal_lamports,
          timestamp: c.launched_at
        }
      )
      |> Repo.all()
      |> Enum.map(fn l ->
        Map.merge(l, %{
          from_state: nil,
          to_state: nil,
          milestone_index: nil,
          milestone_title: nil,
          metadata: %{"goal_lamports" => l.goal_lamports}
        })
      end)

    # Merge and sort by timestamp, take limit
    events =
      (transitions ++ launches)
      |> Enum.sort_by(& &1.timestamp, {:desc, DateTime})
      |> Enum.take(limit)

    json(conn, %{data: events})
  end

  @doc "GET /api/analytics/top-campaigns — top campaigns by raised amount"
  def top_campaigns(conn, _params) do
    results =
      from(c in Campaign,
        where: c.status in ["active", "completed", "funded", "in_progress"],
        order_by: [desc: c.raised_lamports],
        limit: 5,
        select: %{
          id: c.id,
          title: c.title,
          category: c.category,
          status: c.status,
          raised_lamports: c.raised_lamports,
          goal_lamports: c.goal_lamports,
          backers_count: c.backers_count,
          milestones_count: c.milestones_count,
          milestones_approved: c.milestones_approved
        }
      )
      |> Repo.all()

    json(conn, %{data: results})
  end
end
