defmodule QadamBackendWeb.CampaignController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Campaigns
  alias QadamBackend.Backers

  def index(conn, params) do
    campaigns = Campaigns.list_campaigns(
      status: params["status"],
      category: params["category"],
      limit: parse_int(params["limit"], 50)
    )

    json(conn, %{data: Enum.map(campaigns, &campaign_json/1)})
  end

  def show(conn, %{"id" => id}) do
    case Campaigns.get_campaign_with_milestones(id) do
      nil -> conn |> put_status(:not_found) |> json(%{error: "not_found"})
      campaign -> json(conn, %{data: campaign_detail_json(campaign)})
    end
  end

  def backers(conn, %{"id" => id}) do
    positions = Backers.list_positions_for_campaign(id)
    json(conn, %{data: Enum.map(positions, &position_json/1)})
  end

  # JSON serializers

  defp campaign_json(c) do
    %{
      id: c.id,
      solana_pubkey: c.solana_pubkey,
      creator_wallet: c.creator_wallet,
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
      inserted_at: c.inserted_at
    }
  end

  defp campaign_detail_json(c) do
    campaign_json(c)
    |> Map.put(:pitch_video_url, c.pitch_video_url)
    |> Map.put(:token_mint_address, c.token_mint_address)
    |> Map.put(:milestones, Enum.map(c.milestones || [], &milestone_json/1))
  end

  defp milestone_json(m) do
    %{
      id: m.id,
      index: m.index,
      title: m.title,
      description: m.description,
      amount_lamports: m.amount_lamports,
      deadline: m.deadline,
      status: m.status,
      ai_decision: m.ai_decision,
      ai_explanation: m.ai_explanation,
      submitted_at: m.submitted_at,
      decided_at: m.decided_at
    }
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
