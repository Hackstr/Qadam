defmodule QadamBackendWeb.AdminAuditController do
  @moduledoc "Admin: milestones list, milestone detail, audit log, AI stats"
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Milestones.{Milestone, StateTransition}
  alias QadamBackend.AI.AiDecision
  alias QadamBackend.Accounts.User
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.Backers.BackerPosition
  alias QadamBackend.Reputation.CreatorReputation
  alias QadamBackend.Governance.ExtensionVote

  # ── Milestones ──

  @doc "All milestones with filters: status, ai_decision, campaign_id, preset"
  def list_milestones(conn, params) do
    now = DateTime.utc_now()
    five_min_ago = DateTime.add(now, -300, :second)

    query =
      Milestone
      |> preload(:campaign)
      |> order_by(desc: :inserted_at)

    query = case params["status"] do
      nil -> query
      s -> where(query, [m], m.status == ^s)
    end

    query = case params["ai_decision"] do
      nil -> query
      d -> where(query, [m], m.ai_decision == ^d)
    end

    query = case params["campaign_id"] do
      nil -> query
      id -> where(query, [m], m.campaign_id == ^id)
    end

    # Preset views
    query = case params["preset"] do
      "stuck" -> query |> where([m], m.status == "ai_processing" and m.submitted_at < ^five_min_ago)
      "overdue" -> query |> where([m], m.status == "pending" and m.deadline < ^now)
      "past_grace" -> query |> where([m], m.status in ["pending", "grace_period"] and m.grace_deadline < ^now)
      "recent" -> query |> where([m], not is_nil(m.decided_at)) |> order_by(desc: :decided_at)
      _ -> query
    end

    milestones = Repo.all(query)

    json(conn, %{
      data: Enum.map(milestones, fn m ->
        %{
          id: m.id,
          campaign_id: m.campaign_id,
          campaign_title: m.campaign && m.campaign.title,
          index: m.index,
          title: m.title,
          status: m.status,
          ai_decision: m.ai_decision,
          amount_lamports: m.amount_lamports,
          deadline: m.deadline,
          submitted_at: m.submitted_at,
          decided_at: m.decided_at,
          released_at: m.released_at,
        }
      end)
    })
  end

  @doc "Single milestone with full detail + transitions"
  def show_milestone(conn, %{"id" => id}) do
    milestone = Repo.get!(Milestone, id) |> Repo.preload(:campaign)

    transitions =
      StateTransition
      |> where([t], t.milestone_id == ^id)
      |> order_by(asc: :inserted_at)
      |> Repo.all()

    ai_decision =
      AiDecision
      |> where([d], d.milestone_id == ^id)
      |> order_by(desc: :inserted_at)
      |> limit(1)
      |> Repo.one()

    json(conn, %{
      data: %{
        id: milestone.id,
        campaign_id: milestone.campaign_id,
        campaign_title: milestone.campaign && milestone.campaign.title,
        index: milestone.index,
        title: milestone.title,
        description: milestone.description,
        acceptance_criteria: milestone.acceptance_criteria,
        status: milestone.status,
        amount_lamports: milestone.amount_lamports,
        deadline: milestone.deadline,
        grace_deadline: milestone.grace_deadline,
        evidence_text: milestone.evidence_text,
        evidence_links: milestone.evidence_links,
        evidence_files: milestone.evidence_files,
        ai_decision: milestone.ai_decision,
        ai_explanation: milestone.ai_explanation,
        ai_solana_tx: milestone.ai_solana_tx,
        submitted_at: milestone.submitted_at,
        decided_at: milestone.decided_at,
        released_at: milestone.released_at,
        ai_detail: ai_decision && %{
          decision: ai_decision.decision,
          explanation: ai_decision.explanation,
          claude_model: ai_decision.claude_model,
          latency_ms: ai_decision.latency_ms,
          solana_tx_signature: ai_decision.solana_tx_signature,
        },
        transitions: Enum.map(transitions, fn t ->
          %{from_state: t.from_state, to_state: t.to_state, metadata: t.metadata, timestamp: t.inserted_at}
        end),
      }
    })
  end

  # ── Audit Log ──

  @doc "Unified audit log — state transitions + AI decisions merged by time"
  def audit_log(conn, params) do
    limit_val = min(String.to_integer(params["limit"] || "50"), 200)

    # State transitions
    transitions_query =
      StateTransition
      |> preload(milestone: :campaign)
      |> order_by(desc: :inserted_at)
      |> limit(^limit_val)

    transitions_query = case params["campaign_id"] do
      nil -> transitions_query
      campaign_id ->
        transitions_query
        |> join(:inner, [t], m in Milestone, on: t.milestone_id == m.id)
        |> where([t, m], m.campaign_id == ^campaign_id)
    end

    transitions = Repo.all(transitions_query)

    entries = Enum.map(transitions, fn t ->
      actor = cond do
        t.metadata["decided_by"] == "admin" -> "Admin"
        t.to_state in ["ai_processing", "approved", "rejected", "under_human_review"] and t.from_state in ["submitted", "ai_processing"] -> "AI Agent"
        t.to_state in ["grace_period", "failed"] and t.metadata["reason"] -> "Deadline Monitor"
        true -> "System"
      end

      %{
        id: t.id,
        timestamp: t.inserted_at,
        actor: actor,
        action: "#{t.from_state} → #{t.to_state}",
        campaign_title: t.milestone && t.milestone.campaign && t.milestone.campaign.title,
        milestone_index: t.milestone && t.milestone.index,
        details: t.metadata,
      }
    end)

    # Sort by timestamp desc
    entries = Enum.sort_by(entries, & &1.timestamp, {:desc, DateTime})

    json(conn, %{data: entries})
  end

  # ── AI Stats ──

  @doc "AI pipeline statistics"
  def ai_stats(conn, _params) do
    total = Repo.aggregate(AiDecision, :count)
    approved = Repo.aggregate(from(d in AiDecision, where: d.decision == "approved"), :count)
    rejected = Repo.aggregate(from(d in AiDecision, where: d.decision == "rejected"), :count)
    partial = Repo.aggregate(from(d in AiDecision, where: d.decision == "partial"), :count)
    avg_latency = Repo.aggregate(AiDecision, :avg, :latency_ms)

    stuck_count = Repo.aggregate(
      from(m in Milestone,
        where: m.status == "ai_processing" and m.submitted_at < ago(5, "minute")),
      :count
    )

    recent =
      AiDecision
      |> preload(milestone: :campaign)
      |> order_by(desc: :inserted_at)
      |> limit(20)
      |> Repo.all()
      |> Enum.map(fn d ->
        %{
          id: d.id,
          decision: d.decision,
          explanation: d.explanation && String.slice(d.explanation, 0..120),
          claude_model: d.claude_model,
          latency_ms: d.latency_ms,
          timestamp: d.inserted_at,
          campaign_title: d.milestone && d.milestone.campaign && d.milestone.campaign.title,
          milestone_index: d.milestone && d.milestone.index,
        }
      end)

    json(conn, %{
      data: %{
        total_decisions: total,
        approved: approved,
        rejected: rejected,
        partial: partial,
        approval_rate: if(total > 0, do: round(approved / total * 100), else: 0),
        partial_rate: if(total > 0, do: round(partial / total * 100), else: 0),
        avg_latency_ms: avg_latency && round(avg_latency),
        stuck_count: stuck_count,
        recent_decisions: recent,
      }
    })
  end

  # ── Users ──

  def list_users(conn, params) do
    query = User |> order_by(desc: :inserted_at)

    query = case params["search"] do
      nil -> query
      "" -> query
      term ->
        s = "%#{term}%"
        where(query, [u], ilike(u.wallet_address, ^s) or ilike(u.display_name, ^s))
    end

    users = Repo.all(query)

    json(conn, %{
      data: Enum.map(users, fn u ->
        reputation = Repo.get_by(CreatorReputation, wallet_address: u.wallet_address)
        campaigns_count = Repo.aggregate(from(c in Campaign, where: c.creator_wallet == ^u.wallet_address), :count)
        backed_count = Repo.aggregate(from(b in BackerPosition, where: b.wallet_address == ^u.wallet_address), :count)
        total_backed = Repo.aggregate(from(b in BackerPosition, where: b.wallet_address == ^u.wallet_address), :sum, :amount_lamports) || 0

        %{
          id: u.id,
          wallet_address: u.wallet_address,
          display_name: u.display_name,
          email: u.email,
          github_username: u.github_username,
          github_verified: u.github_verified,
          reputation_score: reputation && reputation.score,
          campaigns_count: campaigns_count,
          backed_count: backed_count,
          total_backed_lamports: total_backed,
          inserted_at: u.inserted_at,
        }
      end)
    })
  end

  def show_user(conn, %{"wallet" => wallet}) do
    user = Repo.get_by!(User, wallet_address: wallet)
    reputation = Repo.get_by(CreatorReputation, wallet_address: wallet)

    campaigns =
      Campaign
      |> where([c], c.creator_wallet == ^wallet)
      |> order_by(desc: :inserted_at)
      |> Repo.all()
      |> Enum.map(fn c -> %{id: c.id, title: c.title, status: c.status, raised_lamports: c.raised_lamports} end)

    positions =
      BackerPosition
      |> where([b], b.wallet_address == ^wallet)
      |> preload(:campaign)
      |> Repo.all()
      |> Enum.map(fn b -> %{
        campaign_title: b.campaign && b.campaign.title,
        amount_lamports: b.amount_lamports,
        tier: b.tier,
        tokens_allocated: b.tokens_allocated,
        tokens_claimed: b.tokens_claimed,
        refund_claimed: b.refund_claimed,
      } end)

    json(conn, %{
      data: %{
        id: user.id,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        email: user.email,
        github_username: user.github_username,
        github_verified: user.github_verified,
        inserted_at: user.inserted_at,
        reputation: reputation && %{
          score: reputation.score,
          milestones_on_time: reputation.milestones_on_time,
          milestones_late: reputation.milestones_late,
          campaigns_completed: reputation.campaigns_completed,
          campaigns_refunded: reputation.campaigns_refunded,
        },
        campaigns: campaigns,
        backed_positions: positions,
      }
    })
  end

  # ── Governance ──

  def governance(conn, _params) do
    # Active votes: milestones in voting_active or extension_requested
    active_milestones =
      Milestone
      |> where([m], m.status in ["voting_active", "extension_requested"])
      |> preload(:campaign)
      |> Repo.all()

    active = Enum.map(active_milestones, fn m ->
      votes = Repo.all(from v in ExtensionVote, where: v.milestone_id == ^m.id)
      total_power = Enum.reduce(votes, 0, fn v, acc -> acc + (v.voting_power || 0) end)
      extend_power = votes |> Enum.filter(& &1.vote_approve) |> Enum.reduce(0, fn v, acc -> acc + (v.voting_power || 0) end)

      %{
        milestone_id: m.id,
        milestone_index: m.index,
        milestone_title: m.title,
        campaign_id: m.campaign_id,
        campaign_title: m.campaign && m.campaign.title,
        status: m.status,
        deadline: m.extension_deadline || m.deadline,
        votes_count: length(votes),
        extend_percent: if(total_power > 0, do: round(extend_power / total_power * 100), else: 0),
        refund_percent: if(total_power > 0, do: 100 - round(extend_power / total_power * 100), else: 0),
        votes: Enum.map(votes, fn v ->
          %{wallet: v.voter_wallet, approve: v.vote_approve, power: v.voting_power}
        end),
      }
    end)

    # History: milestones that were in voting and resolved
    history =
      Milestone
      |> where([m], m.status in ["extended", "failed"] and not is_nil(m.extension_deadline))
      |> preload(:campaign)
      |> order_by(desc: :decided_at)
      |> limit(20)
      |> Repo.all()
      |> Enum.map(fn m ->
        %{
          milestone_title: m.title,
          campaign_title: m.campaign && m.campaign.title,
          result: m.status,
          decided_at: m.decided_at,
        }
      end)

    json(conn, %{data: %{active: active, history: history}})
  end
end
