defmodule QadamBackendWeb.WebhookController do
  @moduledoc """
  Webhook endpoint called by frontend after on-chain milestone submission.
  Triggers the AI verification pipeline.

  This replaces the broken WebSocket event parsing approach —
  frontend calls this after successful submit_milestone transaction.
  """
  use QadamBackendWeb, :controller

  alias QadamBackend.{Milestones, Campaigns}
  alias QadamBackend.Workers.AIVerificationWorker
  alias QadamBackend.Notifications.Notify

  action_fallback QadamBackendWeb.FallbackController

  def milestone_submitted(conn, %{"campaign_id" => campaign_id, "milestone_index" => index}) do
    milestone = Milestones.get_milestone_by_campaign_and_index(
      campaign_id,
      String.to_integer(to_string(index))
    )

    case milestone do
      nil ->
        {:error, :not_found}

      milestone ->
        # Enqueue AI verification
        %{milestone_id: milestone.id}
        |> AIVerificationWorker.new()
        |> Oban.insert()

        # Notify backers that evidence submitted
        campaign = Campaigns.get_campaign!(campaign_id)
        Notify.notify_backers(campaign, "milestone_submitted",
          "Evidence submitted — your vote needed",
          "Milestone #{index + 1} evidence has been submitted. Review and vote.",
          %{milestone_title: milestone.title || "Milestone #{index + 1}"})

        json(conn, %{ok: true, milestone_id: milestone.id})
    end
  end
end
