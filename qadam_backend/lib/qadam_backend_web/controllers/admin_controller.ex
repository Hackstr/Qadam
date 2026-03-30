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

  @doc "Admin makes human review decision"
  def decide(conn, %{"id" => id, "approved" => approved}) do
    milestone = Milestones.get_milestone!(id)
    new_status = if approved, do: "approved", else: "rejected"

    case Milestones.transition_state(milestone, new_status, %{decided_by: "admin"}) do
      {:ok, %{milestone: updated}} ->
        json(conn, %{data: %{id: updated.id, status: updated.status}})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: inspect(reason)})
    end
  end

  def health(conn, _params) do
    json(conn, %{status: "ok", timestamp: DateTime.utc_now()})
  end
end
