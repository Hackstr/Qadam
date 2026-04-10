defmodule QadamBackendWeb.SyncController do
  @moduledoc """
  Sync on-chain events with PostgreSQL.
  Called by frontend after successful Anchor transactions.
  """
  use QadamBackendWeb, :controller

  alias QadamBackend.{Campaigns, Backers}

  action_fallback QadamBackendWeb.FallbackController

  @doc "Sync campaign creation — called after on-chain create_campaign + add_milestones"
  def sync_campaign(conn, params) do
    attrs = %{
      solana_pubkey: params["solana_pubkey"],
      creator_wallet: params["creator_wallet"],
      title: params["title"],
      description: params["description"],
      category: params["category"],
      cover_image_url: params["cover_image_url"],
      pitch_video_url: params["pitch_video_url"],
      goal_lamports: params["goal_lamports"],
      milestones_count: params["milestones_count"],
      tokens_per_lamport: params["tokens_per_lamport"],
      status: "active",
    }

    case Campaigns.create_campaign(attrs) do
      {:ok, campaign} ->
        # Create milestones in DB
        for m <- params["milestones"] || [] do
          QadamBackend.Repo.insert!(%QadamBackend.Milestones.Milestone{
            campaign_id: campaign.id,
            index: m["index"],
            title: m["title"],
            description: m["description"],
            acceptance_criteria: m["acceptance_criteria"],
            amount_lamports: m["amount_lamports"],
            deadline: parse_datetime(m["deadline"]),
            grace_deadline: parse_datetime(m["grace_deadline"]),
            status: "pending",
            evidence_links: [],
            evidence_files: %{},
          })
        end

        conn |> put_status(:created) |> json(%{data: %{id: campaign.id, solana_pubkey: campaign.solana_pubkey}})

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc "Sync backing — update raised_lamports and backer_count after on-chain back_campaign"
  def sync_backing(conn, params) do
    campaign_pubkey = params["campaign_pubkey"]
    wallet = params["backer_wallet"]
    amount = params["amount_lamports"]
    tier = params["tier"]
    tokens = params["tokens_allocated"]

    case Campaigns.get_campaign_by_pubkey(campaign_pubkey) do
      nil -> {:error, :not_found}
      campaign ->
        # Update campaign stats
        Campaigns.update_campaign(campaign, %{
          raised_lamports: (campaign.raised_lamports || 0) + amount,
          backers_count: (campaign.backers_count || 0) + 1,
        })

        # Create backer position
        Backers.create_position(%{
          campaign_id: campaign.id,
          wallet_address: wallet,
          amount_lamports: amount,
          tokens_allocated: tokens || 0,
          tier: tier || 1,
        })

        json(conn, %{ok: true})
    end
  end

  @doc "Sync token claim — update backer position after on-chain claim_tokens"
  def sync_claim_tokens(conn, %{"campaign_pubkey" => pubkey, "wallet" => wallet, "tokens_claimed" => claimed}) do
    case Campaigns.get_campaign_by_pubkey(pubkey) do
      nil -> {:error, :not_found}
      campaign ->
        case Backers.get_position_by_campaign_and_wallet(campaign.id, wallet) do
          nil -> {:error, :not_found}
          position ->
            Backers.update_position(position, %{tokens_claimed: claimed})
            json(conn, %{ok: true})
        end
    end
  end

  @doc "Sync vote — record governance vote in DB"
  def sync_vote(conn, %{"campaign_pubkey" => pubkey, "milestone_index" => idx, "wallet" => wallet, "approve" => approve, "voting_power" => power}) do
    case Campaigns.get_campaign_by_pubkey(pubkey) do
      nil -> {:error, :not_found}
      campaign ->
        milestone = QadamBackend.Milestones.get_milestone_by_campaign_and_index(campaign.id, idx)
        if milestone do
          QadamBackend.Repo.insert(%QadamBackend.Governance.ExtensionVote{
            milestone_id: milestone.id,
            voter_wallet: wallet,
            voting_power: power,
            vote_approve: approve,
          }, on_conflict: :nothing)
          json(conn, %{ok: true})
        else
          {:error, :not_found}
        end
    end
  end

  @doc "Sync refund claim"
  def sync_refund(conn, %{"campaign_pubkey" => pubkey, "wallet" => wallet}) do
    case Campaigns.get_campaign_by_pubkey(pubkey) do
      nil -> {:error, :not_found}
      campaign ->
        case Backers.get_position_by_campaign_and_wallet(campaign.id, wallet) do
          nil -> {:error, :not_found}
          position ->
            Backers.update_position(position, %{refund_claimed: true})
            json(conn, %{ok: true})
        end
    end
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(str) when is_binary(str) do
    case DateTime.from_iso8601(str) do
      {:ok, dt, _} -> DateTime.truncate(dt, :second)
      _ -> nil
    end
  end
  defp parse_datetime(unix) when is_integer(unix) do
    DateTime.from_unix!(unix) |> DateTime.truncate(:second)
  end
end
