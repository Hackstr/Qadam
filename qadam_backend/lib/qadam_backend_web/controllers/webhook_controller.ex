defmodule QadamBackendWeb.WebhookController do
  @moduledoc """
  Webhook endpoint called by frontend after on-chain milestone submission.
  Transitions milestone to voting_active so community can vote.
  """
  use QadamBackendWeb, :controller

  alias QadamBackend.{Milestones, Campaigns}
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
        # Transition directly to voting_active — community votes resolve milestones
        case Milestones.transition_state(milestone, "voting_active") do
          {:ok, _} -> :ok
          {:error, reason} ->
            require Logger
            Logger.warning("[Webhook] Cannot transition milestone #{milestone.id} to voting_active: #{inspect(reason)}")
        end

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
