defmodule QadamBackendWeb.CampaignController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Campaigns
  alias QadamBackend.Backers

  action_fallback QadamBackendWeb.FallbackController

  def index(conn, params) do
    campaigns = Campaigns.list_campaigns(
      status: params["status"],
      category: params["category"],
      sort: params["sort"],
      search: params["search"],
      tag: params["tag"],
      limit: parse_int(params["limit"], 50)
    )

    # If no real campaigns and no filters — show demo for first impression
    campaigns = if Enum.empty?(campaigns) && is_nil(params["search"]) && is_nil(params["status"]) do
      Campaigns.list_campaigns(include_demo: true, limit: 9)
    else
      campaigns
    end

    json(conn, %{data: Enum.map(campaigns, &campaign_json/1)})
  end

  def show(conn, %{"id" => id}) do
    case Campaigns.get_campaign_with_milestones(id) do
      nil -> {:error, :not_found}
      campaign -> json(conn, %{data: campaign_detail_json(campaign)})
    end
  end

  @doc "Creator updates campaign details (description, cover, video)"
  def update_campaign(conn, %{"id" => id} = params) do
    wallet = conn.assigns.current_wallet
    campaign = Campaigns.get_campaign!(id)

    if campaign.creator_wallet != wallet do
      conn |> put_status(:forbidden) |> json(%{error: "Not the campaign creator"})
    else
      # Foundation v1: allow story split + team + discovery fields when editing
      allowed_fields = ~w(description cover_image_url pitch_video_url
                          problem solution why_now background risks
                          team_members location tags)
      # Voting params and tier_config only editable in draft status
      allowed_fields = if campaign.status == "draft" do
        allowed_fields ++ ~w(tier_config vote_period_days quorum_pct approval_threshold_pct funding_deadline)
      else
        allowed_fields
      end
      allowed = Map.take(params, allowed_fields)
      case Campaigns.update_campaign(campaign, allowed) do
        {:ok, updated} -> json(conn, %{data: %{id: updated.id, status: "updated"}})
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  def backers(conn, %{"id" => id}) do
    positions = Backers.list_positions_for_campaign(id)
    json(conn, %{data: Enum.map(positions, &position_json/1)})
  end

  # JSON serializers

  defp campaign_json(c) do
    # Lookup creator display_name for list view
    creator_name = case QadamBackend.Accounts.get_user_by_wallet(c.creator_wallet) do
      %{display_name: name} when is_binary(name) and name != "" -> name
      _ -> nil
    end

    %{
      id: c.id,
      solana_pubkey: c.solana_pubkey,
      creator_wallet: c.creator_wallet,
      creator_display_name: creator_name,
      title: c.title,
      description: c.description,
      category: c.category,
      cover_image_url: c.cover_image_url,
      goal_lamports: c.goal_lamports,
      raised_lamports: c.raised_lamports,
      backers_count: c.backers_count,
      status: c.status,
      milestones_count: c.milestones_count,
      milestones_approved: c.milestones_approved,
      # Foundation v1 fields
      problem: c.problem,
      solution: c.solution,
      why_now: c.why_now,
      background: c.background,
      risks: c.risks,
      team_members: c.team_members || [],
      tier_config: c.tier_config || [],
      vote_period_days: c.vote_period_days,
      quorum_pct: c.quorum_pct,
      approval_threshold_pct: c.approval_threshold_pct,
      funding_deadline: c.funding_deadline,
      location: c.location,
      tags: c.tags || [],
      slug: c.slug,
      launched_at: c.launched_at,
      funded_at: c.funded_at,
      inserted_at: c.inserted_at
    }
  end

  defp campaign_detail_json(c) do
    # Look up creator profile
    creator = QadamBackend.Accounts.get_user_by_wallet(c.creator_wallet)
    creator_name = case creator do
      %{display_name: name} when is_binary(name) and name != "" -> name
      _ -> nil
    end

    # Compute days until funding deadline
    days_to_deadline = case c.funding_deadline do
      %DateTime{} = deadline ->
        diff = DateTime.diff(deadline, DateTime.utc_now(), :second)
        max(0, div(diff, 86400))
      _ -> nil
    end

    campaign_json(c)
    |> Map.put(:pitch_video_url, c.pitch_video_url)
    |> Map.put(:token_mint_address, c.token_mint_address)
    |> Map.put(:tokens_per_lamport, c.tokens_per_lamport)
    |> Map.put(:creator_display_name, creator_name)
    |> Map.put(:creator_avatar_url, creator && creator.avatar_url)
    |> Map.put(:creator_bio, creator && creator.bio)
    |> Map.put(:creator_location, creator && creator.location)
    |> Map.put(:creator_socials, (creator && creator.socials) || %{})
    |> Map.put(:days_to_funding_deadline, days_to_deadline)
    |> Map.put(:milestones, Enum.map(c.milestones || [], &milestone_json/1))
  end

  defp milestone_json(m) do
    base = %{
      id: m.id,
      index: m.index,
      title: m.title,
      description: m.description,
      acceptance_criteria: m.acceptance_criteria,
      acceptance_criteria_list: m.acceptance_criteria_list || [],
      deliverables: m.deliverables,
      amount_lamports: m.amount_lamports,
      deadline: m.deadline,
      extension_deadline: m.extension_deadline,
      status: m.status,
      ai_decision: m.ai_decision,
      ai_explanation: m.ai_explanation,
      evidence_text: m.evidence_text,
      evidence_links: m.evidence_links,
      submitted_at: m.submitted_at,
      decided_at: m.decided_at,
      released_at: m.released_at
    }

    # Add vote counts for milestones in voting state
    if m.status in ["voting_active", "extension_requested"] do
      votes = QadamBackend.Repo.all(
        from(v in QadamBackend.Governance.ExtensionVote,
          where: v.milestone_id == ^m.id)
      )
      approve_power = votes |> Enum.filter(& &1.vote_approve) |> Enum.reduce(0, fn v, acc -> acc + (v.voting_power || 0) end)
      reject_power = votes |> Enum.reject(& &1.vote_approve) |> Enum.reduce(0, fn v, acc -> acc + (v.voting_power || 0) end)
      total_power = approve_power + reject_power

      base
      |> Map.put(:votes_count, length(votes))
      |> Map.put(:votes_approve, approve_power)
      |> Map.put(:votes_reject, reject_power)
      |> Map.put(:votes_total_power, total_power)
      |> Map.put(:votes_approve_percent, if(total_power > 0, do: round(approve_power / total_power * 100), else: 0))
    else
      base
    end
  end

  defp position_json(p) do
    %{
      wallet_address: p.wallet_address,
      amount_lamports: p.amount_lamports,
      tokens_allocated: p.tokens_allocated,
      tokens_claimed: p.tokens_claimed,
      tier: p.tier
    }
  end

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) do
    case Integer.parse(to_string(val)) do
      {n, _} -> min(n, 100)
      :error -> default
    end
  end
end
