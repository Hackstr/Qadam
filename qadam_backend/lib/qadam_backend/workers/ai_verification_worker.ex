defmodule QadamBackend.Workers.AIVerificationWorker do
  @moduledoc """
  Oban worker: calls Claude API to verify a milestone.

  Pipeline: MilestoneSubmitted event → this worker → Claude API → decision →
    APPROVED: enqueue TxBroadcastWorker (release_milestone)
    PARTIAL: enqueue TxBroadcastWorker (mark_under_human_review)
    REJECTED: update milestone status, notify creator
  """
  use Oban.Worker,
    queue: :ai_verification,
    max_attempts: 3,
    unique: [period: 3600, keys: [:milestone_id]]

  alias QadamBackend.{Milestones, Repo}
  alias QadamBackend.AI.AiDecision
  alias QadamBackend.Claude.{Client, PromptBuilder}
  alias QadamBackend.Evidence.HashVerifier
  alias QadamBackend.Workers.TxBroadcastWorker

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"milestone_id" => milestone_id}}) do
    milestone = Milestones.get_milestone!(milestone_id) |> Repo.preload(:campaign)
    campaign = milestone.campaign

    # 1. Transition: submitted → ai_processing
    case Milestones.transition_state(milestone, "ai_processing") do
      {:ok, %{milestone: milestone}} -> verify(milestone, campaign)
      {:error, reason} ->
        Logger.warning("[AI] Cannot transition #{milestone_id}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp verify(milestone, campaign) do
    # 2. Verify evidence hash matches on-chain (if hash available)
    case HashVerifier.verify(milestone) do
      {:error, :hash_mismatch} ->
        Logger.warning("[AI] Hash mismatch for milestone #{milestone.id}")
        Milestones.transition_state(milestone, "rejected", %{reason: "evidence_hash_mismatch"})
        {:ok, :hash_mismatch}

      _ ->
        # 3. Build prompt and call Claude
        prompt = PromptBuilder.build_verification_prompt(milestone, campaign)

        case Client.verify_milestone(prompt) do
          {:ok, %{response: response, model: model, latency_ms: latency_ms}} ->
            handle_claude_response(milestone, campaign, response, model, latency_ms, prompt)

          {:error, reason} ->
            Logger.error("[AI] Claude API error: #{inspect(reason)}")
            # Let Oban retry
            {:error, reason}
        end
    end
  end

  defp handle_claude_response(milestone, _campaign, response, model, latency_ms, prompt) do
    parsed = PromptBuilder.parse_response(response)

    # 4. Log AI decision
    prompt_hash = :crypto.hash(:sha256, prompt) |> Base.encode16(case: :lower)
    response_hash = :crypto.hash(:sha256, response) |> Base.encode16(case: :lower)

    Repo.insert!(%AiDecision{
      milestone_id: milestone.id,
      decision: parsed.decision,
      explanation: parsed.explanation,
      prompt_hash: prompt_hash,
      response_hash: response_hash,
      claude_model: model,
      latency_ms: latency_ms
    })

    # 5. Update milestone and enqueue next step
    ai_decision_hash = response_hash

    case parsed.decision do
      "approved" ->
        Milestones.transition_state(milestone, "approved", %{ai: true})
        enqueue_tx_broadcast(milestone, "release_milestone", ai_decision_hash)

      "partial" ->
        Milestones.transition_state(milestone, "under_human_review", %{ai: true})
        enqueue_tx_broadcast(milestone, "mark_under_human_review", ai_decision_hash)

      "rejected" ->
        Milestones.update_milestone(milestone, %{
          ai_decision: "rejected",
          ai_explanation: parsed.explanation,
          ai_decision_hash: ai_decision_hash,
          decided_at: DateTime.utc_now()
        })
        Milestones.transition_state(milestone, "rejected", %{ai: true})
    end

    {:ok, parsed.decision}
  end

  defp enqueue_tx_broadcast(milestone, instruction, ai_decision_hash) do
    %{
      milestone_id: milestone.id,
      instruction: instruction,
      ai_decision_hash: ai_decision_hash
    }
    |> TxBroadcastWorker.new()
    |> Oban.insert()
  end
end
