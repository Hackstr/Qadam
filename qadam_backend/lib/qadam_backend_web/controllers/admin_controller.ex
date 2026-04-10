defmodule QadamBackendWeb.AdminController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Milestones

  @doc "List milestones pending human review — enriched with context"
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
        # Get creator reputation
        reputation = if m.campaign do
          QadamBackend.Repo.get_by(
            QadamBackend.Reputation.CreatorReputation,
            wallet_address: m.campaign.creator_wallet
          )
        end

        # Get state transitions for this milestone
        transitions =
          QadamBackend.Milestones.StateTransition
          |> where([t], t.milestone_id == ^m.id)
          |> order_by(asc: :inserted_at)
          |> QadamBackend.Repo.all()

        # Get creator display name
        creator_user = if m.campaign do
          QadamBackend.Accounts.get_user_by_wallet(m.campaign.creator_wallet)
        end

        %{
          id: m.id,
          campaign_id: m.campaign_id,
          campaign_title: m.campaign && m.campaign.title,
          creator_wallet: m.campaign && m.campaign.creator_wallet,
          creator_display_name: creator_user && creator_user.display_name,
          creator_reputation: reputation && %{
            score: reputation.score,
            milestones_on_time: reputation.milestones_on_time,
            milestones_late: reputation.milestones_late,
          },
          index: m.index,
          title: m.title,
          description: m.description,
          acceptance_criteria: m.acceptance_criteria,
          status: m.status,
          amount_lamports: m.amount_lamports,
          evidence_text: m.evidence_text,
          evidence_links: m.evidence_links,
          evidence_files: m.evidence_files,
          ai_decision: m.ai_decision,
          ai_explanation: m.ai_explanation,
          submitted_at: m.submitted_at,
          decided_at: m.decided_at,
          deadline: m.deadline,
          transitions: Enum.map(transitions, fn t ->
            %{
              from_state: t.from_state,
              to_state: t.to_state,
              metadata: t.metadata,
              timestamp: t.inserted_at,
            }
          end),
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

  @doc "Admin campaigns list with pagination"
  def list_campaigns(conn, params) do
    campaigns = QadamBackend.Campaigns.list_campaigns(
      status: params["status"],
      category: params["category"],
      search: params["search"],
      sort: params["sort"] || "newest"
    )

    json(conn, %{
      data: Enum.map(campaigns, fn c ->
        %{
          id: c.id,
          solana_pubkey: c.solana_pubkey,
          title: c.title,
          creator_wallet: c.creator_wallet,
          status: c.status,
          category: c.category,
          cover_image_url: c.cover_image_url,
          goal_lamports: c.goal_lamports,
          raised_lamports: c.raised_lamports,
          backers_count: c.backers_count,
          milestones_count: c.milestones_count,
          milestones_approved: c.milestones_approved,
          featured: c.featured,
          inserted_at: c.inserted_at,
        }
      end)
    })
  end

  @doc "Admin campaign detail — full data with milestones + backers"
  def show_campaign(conn, %{"id" => id}) do
    campaign = QadamBackend.Campaigns.get_campaign!(id)
      |> QadamBackend.Repo.preload([
        milestones: from(m in QadamBackend.Milestones.Milestone, order_by: m.index),
        backer_positions: from(b in QadamBackend.Backers.BackerPosition, order_by: [desc: :amount_lamports])
      ])

    updates = QadamBackend.Campaigns.list_updates_for_campaign(id)

    json(conn, %{
      data: %{
        id: campaign.id,
        solana_pubkey: campaign.solana_pubkey,
        title: campaign.title,
        description: campaign.description,
        creator_wallet: campaign.creator_wallet,
        status: campaign.status,
        category: campaign.category,
        cover_image_url: campaign.cover_image_url,
        pitch_video_url: campaign.pitch_video_url,
        goal_lamports: campaign.goal_lamports,
        raised_lamports: campaign.raised_lamports,
        backers_count: campaign.backers_count,
        milestones_count: campaign.milestones_count,
        milestones_approved: campaign.milestones_approved,
        tokens_per_lamport: campaign.tokens_per_lamport,
        featured: campaign.featured,
        inserted_at: campaign.inserted_at,
        milestones: Enum.map(campaign.milestones, fn m ->
          %{
            id: m.id, index: m.index, title: m.title, description: m.description,
            acceptance_criteria: m.acceptance_criteria, status: m.status,
            amount_lamports: m.amount_lamports, deadline: m.deadline,
            evidence_text: m.evidence_text, evidence_links: m.evidence_links,
            ai_decision: m.ai_decision, ai_explanation: m.ai_explanation,
            submitted_at: m.submitted_at, decided_at: m.decided_at, released_at: m.released_at,
          }
        end),
        backers: Enum.map(campaign.backer_positions, fn b ->
          %{
            wallet_address: b.wallet_address, amount_lamports: b.amount_lamports,
            tokens_allocated: b.tokens_allocated, tokens_claimed: b.tokens_claimed,
            tier: b.tier, refund_claimed: b.refund_claimed, backed_at: b.inserted_at,
          }
        end),
        updates: Enum.map(updates, fn u ->
          %{id: u.id, title: u.title, content: u.content, inserted_at: u.inserted_at}
        end),
      }
    })
  end

  def pause_campaign(conn, %{"id" => id}) do
    campaign = QadamBackend.Campaigns.get_campaign!(id)
    case QadamBackend.Campaigns.update_campaign(campaign, %{status: "paused"}) do
      {:ok, updated} -> json(conn, %{data: %{id: updated.id, status: updated.status}})
      {:error, reason} -> conn |> put_status(:unprocessable_entity) |> json(%{error: inspect(reason)})
    end
  end

  def resume_campaign(conn, %{"id" => id}) do
    campaign = QadamBackend.Campaigns.get_campaign!(id)
    case QadamBackend.Campaigns.update_campaign(campaign, %{status: "active"}) do
      {:ok, updated} -> json(conn, %{data: %{id: updated.id, status: updated.status}})
      {:error, reason} -> conn |> put_status(:unprocessable_entity) |> json(%{error: inspect(reason)})
    end
  end

  def set_featured(conn, %{"id" => id, "featured" => featured}) do
    campaign = QadamBackend.Campaigns.get_campaign!(id)

    case QadamBackend.Campaigns.update_campaign(campaign, %{featured: featured}) do
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
