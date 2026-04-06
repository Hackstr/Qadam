defmodule QadamBackendWeb.AdminController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Milestones

  @doc "List milestones pending human review"
  def review_queue(conn, _params) do
    milestones =
      QadamBackend.Repo.all(
        from m in QadamBackend.Milestones.Milestone,
          where: m.status == "under_human_review",
          order_by: [asc: :submitted_at],
          preload: [:campaign]
      )

    json(conn, %{
      data: Enum.map(milestones, fn m ->
        %{
          id: m.id,
          campaign_id: m.campaign_id,
          campaign_title: m.campaign && m.campaign.title,
          index: m.index,
          status: m.status,
          evidence_text: m.evidence_text,
          evidence_links: m.evidence_links,
          ai_decision: m.ai_decision,
          ai_explanation: m.ai_explanation,
          submitted_at: m.submitted_at
        }
      end)
    })
  end

  @doc "Admin makes human review decision — updates DB + broadcasts Anchor tx"
  def decide(conn, %{"id" => id, "approved" => approved}) do
    milestone = Milestones.get_milestone!(id) |> QadamBackend.Repo.preload(:campaign)
    new_status = if approved, do: "approved", else: "rejected"
    decision_hash = :crypto.strong_rand_bytes(32) |> Base.encode16(case: :lower)

    case Milestones.transition_state(milestone, new_status, %{decided_by: "admin"}) do
      {:ok, %{milestone: updated}} ->
        # Broadcast Anchor transaction for admin_override_decision
        if approved do
          %{
            milestone_id: updated.id,
            instruction: "admin_override_decision",
            ai_decision_hash: decision_hash
          }
          |> QadamBackend.Workers.TxBroadcastWorker.new()
          |> Oban.insert()

          # Update reputation
          if milestone.campaign do
            QadamBackend.Reputation.record_milestone_on_time(milestone.campaign.creator_wallet)
          end
        end

        json(conn, %{data: %{id: updated.id, status: updated.status}})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: inspect(reason)})
    end
  end

  def set_featured(conn, %{"id" => id, "featured" => featured}) do
    campaign = Campaigns.get_campaign!(id)

    case Campaigns.update_campaign(campaign, %{featured: featured}) do
      {:ok, updated} ->
        json(conn, %{data: %{id: updated.id, featured: updated.featured}})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: inspect(reason)})
    end
  end

  def health(conn, _params) do
    json(conn, %{status: "ok", timestamp: DateTime.utc_now()})
  end
end
