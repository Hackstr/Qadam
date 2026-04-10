defmodule QadamBackendWeb.AdminDashboardController do
  @moduledoc "Admin dashboard metrics and needs-attention items"
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.Milestones.Milestone
  alias QadamBackend.Milestones.StateTransition
  alias QadamBackend.Backers.BackerPosition
  alias QadamBackend.AI.AiDecision

  def index(conn, _params) do
    now = DateTime.utc_now()
    five_min_ago = DateTime.add(now, -300, :second)

    # Basic metrics
    total_campaigns = Repo.aggregate(Campaign, :count)
    active_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "active"), :count)
    completed_campaigns = Repo.aggregate(from(c in Campaign, where: c.status == "completed"), :count)
    total_raised = Repo.aggregate(Campaign, :sum, :raised_lamports) || 0
    total_backers = Repo.aggregate(BackerPosition, :count)
    pending_reviews = Repo.aggregate(from(m in Milestone, where: m.status == "under_human_review"), :count)

    # Success rate
    finished = completed_campaigns + Repo.aggregate(from(c in Campaign, where: c.status == "refunded"), :count)
    success_rate = if finished > 0, do: round(completed_campaigns / finished * 100), else: 0

    # AI accuracy
    total_decisions = Repo.aggregate(AiDecision, :count)
    approved_decisions = Repo.aggregate(from(d in AiDecision, where: d.decision == "approved"), :count)
    ai_accuracy = if total_decisions > 0, do: round(approved_decisions / total_decisions * 100), else: 0

    # Needs attention
    overdue_milestones =
      Milestone
      |> where([m], m.status == "pending" and m.deadline < ^now)
      |> preload(:campaign)
      |> Repo.all()
      |> Enum.map(&attention_item(&1, "overdue"))

    stuck_in_ai =
      Milestone
      |> where([m], m.status == "ai_processing" and m.submitted_at < ^five_min_ago)
      |> preload(:campaign)
      |> Repo.all()
      |> Enum.map(&attention_item(&1, "stuck_in_ai"))

    under_review =
      Milestone
      |> where([m], m.status == "under_human_review")
      |> preload(:campaign)
      |> order_by(asc: :submitted_at)
      |> Repo.all()
      |> Enum.map(&attention_item(&1, "needs_review"))

    needs_attention = under_review ++ overdue_milestones ++ stuck_in_ai

    # Recent activity (last 10 transitions)
    recent_activity =
      StateTransition
      |> order_by(desc: :inserted_at)
      |> limit(10)
      |> preload(milestone: :campaign)
      |> Repo.all()
      |> Enum.map(fn t ->
        %{
          id: t.id,
          from_state: t.from_state,
          to_state: t.to_state,
          metadata: t.metadata,
          timestamp: t.inserted_at,
          campaign_title: t.milestone && t.milestone.campaign && t.milestone.campaign.title,
          milestone_index: t.milestone && t.milestone.index,
        }
      end)

    json(conn, %{
      data: %{
        total_campaigns: total_campaigns,
        active_campaigns: active_campaigns,
        completed_campaigns: completed_campaigns,
        total_raised_lamports: total_raised,
        total_backers: total_backers,
        pending_reviews: pending_reviews,
        success_rate: success_rate,
        ai_accuracy: ai_accuracy,
        total_decisions: total_decisions,
        needs_attention: needs_attention,
        recent_activity: recent_activity,
      }
    })
  end

  defp attention_item(milestone, type) do
    %{
      type: type,
      milestone_id: milestone.id,
      milestone_index: milestone.index,
      milestone_title: milestone.title,
      campaign_id: milestone.campaign_id,
      campaign_title: milestone.campaign && milestone.campaign.title,
      submitted_at: milestone.submitted_at,
      deadline: milestone.deadline,
    }
  end
end
