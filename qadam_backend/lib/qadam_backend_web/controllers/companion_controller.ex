defmodule QadamBackendWeb.CompanionController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.AI.Companion
  alias QadamBackend.Campaigns
  alias QadamBackend.Milestones

  action_fallback QadamBackendWeb.FallbackController

  @anthropic_url "https://api.anthropic.com/v1/messages"

  # ── GET /api/ai/nudges?campaign_id=X ──
  def nudges(conn, params) do
    wallet = conn.assigns.current_wallet

    nudges = case params["campaign_id"] do
      nil -> Companion.list_nudges_for_wallet(wallet)
      campaign_id -> [Companion.get_latest_nudge(campaign_id)] |> Enum.filter(& &1)
    end

    json(conn, %{data: Enum.map(nudges, &nudge_json/1)})
  end

  # ── POST /api/ai/nudges/:id/dismiss ──
  def dismiss_nudge(conn, %{"id" => id}) do
    case Companion.dismiss_nudge(id) do
      {:ok, _} -> json(conn, %{ok: true})
      {:error, _} -> conn |> put_status(:not_found) |> json(%{error: "not_found"})
    end
  end

  # ── POST /api/ai/evidence_draft ──
  def evidence_draft(conn, %{"milestone_id" => milestone_id}) do
    milestone = QadamBackend.Repo.get(QadamBackend.Milestones.Milestone, milestone_id)

    if is_nil(milestone) do
      conn |> put_status(:not_found) |> json(%{error: "milestone_not_found"})
    else
      criteria = milestone.acceptance_criteria_list || []
      criteria_text = if length(criteria) > 0 do
        criteria |> Enum.with_index(1) |> Enum.map(fn {c, i} -> "#{i}. #{c}" end) |> Enum.join("\n")
      else
        milestone.acceptance_criteria || "No specific criteria defined"
      end

      prompt = """
      Generate a structured outline for evidence submission for this milestone.

      Milestone: #{milestone.title || "Untitled"}
      Description: #{milestone.description || "No description"}

      Acceptance criteria:
      #{criteria_text}

      For each criterion, write a heading and 2-3 sentence scaffold of how the creator might prove it.
      Don't fabricate specifics — leave placeholders like [link to deployed app].
      Return as JSON array: [{"criterion": "...", "scaffold": "..."}]
      """

      case call_anthropic(prompt) do
        {:ok, text} ->
          # Try to parse as JSON, fall back to raw text
          outline = case Jason.decode(text) do
            {:ok, parsed} when is_list(parsed) -> parsed
            _ -> [%{"criterion" => "Evidence outline", "scaffold" => text}]
          end
          json(conn, %{data: outline})

        {:error, reason} ->
          conn |> put_status(:service_unavailable) |> json(%{error: reason})
      end
    end
  end

  # ── POST /api/ai/update_draft ──
  def update_draft(conn, %{"campaign_id" => campaign_id} = params) do
    campaign = Campaigns.get_campaign_with_milestones(campaign_id)
    user_prompt = params["prompt"] || "General update"

    if is_nil(campaign) do
      conn |> put_status(:not_found) |> json(%{error: "campaign_not_found"})
    else
      prompt = """
      Draft a structured campaign update for "#{campaign.title}".

      Creator says the update is about: #{user_prompt}

      Current milestone: #{campaign.milestones_approved + 1} of #{campaign.milestones_count}
      Funding: #{campaign.raised_lamports / 1_000_000_000} SOL raised of #{campaign.goal_lamports / 1_000_000_000} SOL goal

      Write three sections:
      1. What got done (2-3 bullets)
      2. What's coming next (1-2 bullets)
      3. Any risks or asks for backers (optional, 1 bullet if relevant)

      Keep it under 200 words. Be specific. Use the creator's voice.
      Return as JSON: {"title": "...", "body": "...", "sections": {"done": "...", "next": "...", "risks": "..."}}
      """

      case call_anthropic(prompt) do
        {:ok, text} ->
          draft = case Jason.decode(text) do
            {:ok, parsed} when is_map(parsed) -> parsed
            _ -> %{"title" => "Campaign Update", "body" => text}
          end
          json(conn, %{data: draft})

        {:error, reason} ->
          conn |> put_status(:service_unavailable) |> json(%{error: reason})
      end
    end
  end

  # ── POST /api/ai/companion_chat ──
  def companion_chat(conn, %{"campaign_id" => campaign_id, "message" => message} = params) do
    wallet = conn.assigns.current_wallet
    campaign = Campaigns.get_campaign_with_milestones(campaign_id)

    if is_nil(campaign) do
      conn |> put_status(:not_found) |> json(%{error: "campaign_not_found"})
    else
      # Get or create conversation
      {:ok, conv} = case params["conversation_id"] do
        nil -> Companion.get_or_create_conversation(campaign_id, wallet)
        conv_id ->
          case Companion.get_conversation_with_messages(conv_id) do
            nil -> Companion.get_or_create_conversation(campaign_id, wallet)
            conv -> {:ok, conv}
          end
      end

      # Save user message
      Companion.add_message(conv.id, "user", message)

      # Build context
      history = (Companion.get_conversation_with_messages(conv.id) || %{messages: []}).messages
      history_text = history
        |> Enum.take(-20)
        |> Enum.map(fn m -> "#{m.role}: #{m.content}" end)
        |> Enum.join("\n")

      current_ms = Enum.at(campaign.milestones || [], campaign.milestones_approved)
      days_left = if current_ms && current_ms.deadline do
        diff = DateTime.diff(current_ms.deadline, DateTime.utc_now(), :second)
        max(0, div(diff, 86400))
      end

      system_prompt = """
      You are the AI Companion for "#{campaign.title}" on Qadam — a crowdfunding platform on Solana.
      You help the creator reach milestones on time. You never judge milestones (that's the community's job).
      You never publish anything. You suggest, the creator decides.

      Campaign: #{campaign.title}
      Current milestone: #{if current_ms, do: "#{current_ms.title} (#{days_left || "?"} days left)", else: "All completed"}
      Milestones: #{campaign.milestones_approved}/#{campaign.milestones_count} approved
      Backers: #{campaign.backers_count}
      Raised: #{campaign.raised_lamports / 1_000_000_000} SOL

      Conversation history:
      #{history_text}

      Be concise, practical, and honest. If unsure about technical specifics, say so.
      """

      prompt = message

      case call_anthropic(prompt, system_prompt) do
        {:ok, response} ->
          Companion.add_message(conv.id, "assistant", response)
          json(conn, %{data: %{
            conversation_id: conv.id,
            response: response,
          }})

        {:error, reason} ->
          conn |> put_status(:service_unavailable) |> json(%{error: reason})
      end
    end
  end

  # ── Private helpers ──

  defp call_anthropic(prompt, system_prompt \\ nil) do
    api_key = System.get_env("ANTHROPIC_API_KEY") || Application.get_env(:qadam_backend, :anthropic_api_key)

    if is_nil(api_key) do
      {:error, "API key not configured"}
    else
      messages = [%{"role" => "user", "content" => prompt}]
      body = %{
        "model" => "claude-sonnet-4-20250514",
        "max_tokens" => 1024,
        "messages" => messages,
      }
      body = if system_prompt, do: Map.put(body, "system", system_prompt), else: body

      headers = [
        {"Content-Type", "application/json"},
        {"x-api-key", api_key},
        {"anthropic-version", "2023-06-01"},
      ]

      case HTTPoison.post(@anthropic_url, Jason.encode!(body), headers, recv_timeout: 30_000) do
        {:ok, %{status_code: 200, body: resp_body}} ->
          case Jason.decode(resp_body) do
            {:ok, %{"content" => [%{"text" => text} | _]}} -> {:ok, text}
            _ -> {:error, "unexpected_response"}
          end
        {:ok, %{status_code: code, body: resp_body}} ->
          {:error, "anthropic_error_#{code}: #{String.slice(resp_body, 0, 200)}"}
        {:error, reason} ->
          {:error, "request_failed: #{inspect(reason)}"}
      end
    end
  end

  defp nudge_json(n) do
    %{
      id: n.id,
      campaign_id: n.campaign_id,
      title: n.title,
      body: n.body,
      primary_cta_label: n.primary_cta_label,
      primary_cta_action: n.primary_cta_action,
      generated_at: n.generated_at,
      dismissed_at: n.dismissed_at,
      read_at: n.read_at,
    }
  end
end
