defmodule QadamBackend.AI.Companion.DigestWorker do
  @moduledoc """
  Oban worker that runs daily (9am UTC via Cron plugin).
  For each active campaign, generates a Daily Nudge using Anthropic API.

  Foundation §06: "Once per day. One single suggestion, the most important today."
  """
  use Oban.Worker, queue: :companion, max_attempts: 2

  import Ecto.Query
  alias QadamBackend.Repo
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.AI.Companion
  alias QadamBackend.AI.Companion.Nudge

  require Logger

  @anthropic_url "https://api.anthropic.com/v1/messages"

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("[CompanionDigest] Starting daily nudge generation")

    # Find all active campaigns
    campaigns =
      Campaign
      |> where([c], c.status in ["active", "funded", "in_progress"])
      |> Repo.all()
      |> Repo.preload(milestones: from(m in QadamBackend.Milestones.Milestone, order_by: m.index))

    results = Enum.map(campaigns, &generate_nudge_for_campaign/1)

    generated = Enum.count(results, &match?({:ok, _}, &1))
    skipped = Enum.count(results, &match?(:skip, &1))
    errors = Enum.count(results, &match?({:error, _}, &1))

    Logger.info("[CompanionDigest] Done: #{generated} generated, #{skipped} skipped, #{errors} errors")
    :ok
  end

  defp generate_nudge_for_campaign(campaign) do
    # Skip if a non-dismissed nudge was generated in the last 20 hours
    recent_nudge =
      Nudge
      |> where([n],
        n.campaign_id == ^campaign.id and
        is_nil(n.dismissed_at) and
        n.generated_at > ^DateTime.add(DateTime.utc_now(), -20 * 3600, :second)
      )
      |> Repo.one()

    if recent_nudge do
      :skip
    else
      do_generate(campaign)
    end
  end

  defp do_generate(campaign) do
    # Build context bundle
    current_milestone = Enum.at(campaign.milestones || [], campaign.milestones_approved)

    days_to_deadline = if current_milestone && current_milestone.deadline do
      diff = DateTime.diff(current_milestone.deadline, DateTime.utc_now(), :second)
      max(0, div(diff, 86400))
    end

    # Find last update age
    last_update = QadamBackend.Repo.one(
      from(u in QadamBackend.Campaigns.CampaignUpdate,
        where: u.campaign_id == ^campaign.id,
        order_by: [desc: u.inserted_at],
        limit: 1,
        select: u.inserted_at
      )
    )

    last_update_days = if last_update do
      div(DateTime.diff(DateTime.utc_now(), last_update, :second), 86400)
    end

    context = """
    Campaign: #{campaign.title}
    Status: #{campaign.status}
    Milestones: #{campaign.milestones_approved}/#{campaign.milestones_count} approved
    Backers: #{campaign.backers_count}
    Raised: #{(campaign.raised_lamports || 0) / 1_000_000_000} SOL of #{(campaign.goal_lamports || 0) / 1_000_000_000} SOL goal
    Current milestone: #{if current_milestone, do: "#{current_milestone.title} — #{days_to_deadline || "?"} days to deadline, status: #{current_milestone.status}", else: "All completed"}
    Last update posted: #{if last_update_days, do: "#{last_update_days} days ago", else: "never"}
    """

    prompt = """
    You are the AI Companion for a crowdfunding campaign on Qadam.
    Your role: help the creator ship milestones on time. Never judge. Never publish. Just suggest the ONE most important action today.

    #{context}

    Generate a daily nudge with:
    - title: short, actionable (max 60 chars)
    - body: 1-2 sentences explaining why this matters today
    - primary_cta_label: button text (e.g. "Draft an update", "Submit evidence", "Review milestone")
    - primary_cta_action: a URL path (e.g. "/dashboard/CAMPAIGN_ID/submit" or "/dashboard/CAMPAIGN_ID/update")

    Replace CAMPAIGN_ID with: #{campaign.id}

    Return ONLY valid JSON: {"title": "...", "body": "...", "primary_cta_label": "...", "primary_cta_action": "..."}
    """

    case call_anthropic(prompt) do
      {:ok, text} ->
        case Jason.decode(text) do
          {:ok, %{"title" => title, "body" => body} = parsed} ->
            Companion.create_nudge(%{
              campaign_id: campaign.id,
              creator_wallet: campaign.creator_wallet,
              title: title,
              body: body,
              primary_cta_label: parsed["primary_cta_label"],
              primary_cta_action: parsed["primary_cta_action"],
              generated_at: DateTime.utc_now(),
              source_signals: %{
                days_to_deadline: days_to_deadline,
                last_update_days: last_update_days,
                milestones_approved: campaign.milestones_approved,
                backers_count: campaign.backers_count,
              }
            })

          _ ->
            Logger.warning("[CompanionDigest] Failed to parse AI response for campaign #{campaign.id}")
            {:error, :parse_failed}
        end

      {:error, reason} ->
        Logger.warning("[CompanionDigest] API error for campaign #{campaign.id}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp call_anthropic(prompt) do
    api_key = System.get_env("ANTHROPIC_API_KEY") || Application.get_env(:qadam_backend, :anthropic_api_key)

    if is_nil(api_key) do
      {:error, "API key not configured"}
    else
      body = Jason.encode!(%{
        "model" => "claude-sonnet-4-20250514",
        "max_tokens" => 512,
        "messages" => [%{"role" => "user", "content" => prompt}],
      })

      headers = [
        {"Content-Type", "application/json"},
        {"x-api-key", api_key},
        {"anthropic-version", "2023-06-01"},
      ]

      case HTTPoison.post(@anthropic_url, body, headers, recv_timeout: 30_000) do
        {:ok, %{status_code: 200, body: resp_body}} ->
          case Jason.decode(resp_body) do
            {:ok, %{"content" => [%{"text" => text} | _]}} -> {:ok, String.trim(text)}
            _ -> {:error, "unexpected_response"}
          end
        {:ok, %{status_code: code}} ->
          {:error, "anthropic_#{code}"}
        {:error, reason} ->
          {:error, inspect(reason)}
      end
    end
  end
end
