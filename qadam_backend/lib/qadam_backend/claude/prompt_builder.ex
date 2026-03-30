defmodule QadamBackend.Claude.PromptBuilder do
  @moduledoc """
  Builds verification prompts for Claude AI.
  """

  def build_verification_prompt(milestone, campaign) do
    """
    Role: You are a fair milestone evaluator for a blockchain crowdfunding platform called Qadam.

    Context: A creator committed to this milestone as part of their campaign.

    Campaign: #{campaign.title}
    #{if campaign.description, do: "Campaign Description: #{campaign.description}", else: ""}

    Milestone #{milestone.index + 1} of #{campaign.milestones_count}:
    #{if milestone.title, do: "Title: #{milestone.title}", else: ""}
    #{if milestone.description, do: "Description: #{milestone.description}", else: ""}
    #{if milestone.acceptance_criteria, do: "Acceptance Criteria: #{milestone.acceptance_criteria}", else: ""}
    Amount: #{format_sol(milestone.amount_lamports)} SOL

    Evidence submitted by the creator:
    - Text: #{milestone.evidence_text || "(none)"}
    - Links: #{format_links(milestone.evidence_links)}

    Instructions:
    1. Evaluate whether the evidence demonstrates completion of this milestone.
    2. Be strict but fair. The creator's funding depends on your decision.
    3. If links are provided, assess whether they plausibly belong to this project.

    Respond in EXACTLY this format:
    Line 1: APPROVED, REJECTED, or PARTIAL
    Line 2-4: Brief explanation (what was done well, what is missing, any concerns)

    Red flags to watch for:
    - Generic or stock content not specific to this project
    - Links that don't match the campaign description
    - Insufficient evidence for the claimed work
    """
  end

  @doc "Parse Claude's response into a structured decision"
  def parse_response(response_text) do
    lines = String.split(response_text, "\n", trim: true)

    decision =
      case lines do
        [first | _] ->
          first
          |> String.trim()
          |> String.upcase()
          |> normalize_decision()

        _ ->
          "partial"
      end

    explanation = lines |> Enum.drop(1) |> Enum.join("\n") |> String.trim()

    %{decision: decision, explanation: explanation}
  end

  defp normalize_decision("APPROVED"), do: "approved"
  defp normalize_decision("REJECTED"), do: "rejected"
  defp normalize_decision("PARTIAL"), do: "partial"
  defp normalize_decision(_), do: "partial"

  defp format_sol(lamports) when is_integer(lamports), do: "#{lamports / 1_000_000_000}"
  defp format_sol(_), do: "?"

  defp format_links(nil), do: "(none)"
  defp format_links([]), do: "(none)"
  defp format_links(links), do: Enum.join(links, "\n  - ")
end
