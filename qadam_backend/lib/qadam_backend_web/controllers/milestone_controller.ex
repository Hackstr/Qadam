defmodule QadamBackendWeb.MilestoneController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Milestones
  alias QadamBackend.Campaigns

  def index(conn, %{"campaign_id" => campaign_id}) do
    milestones = Milestones.list_milestones_for_campaign(campaign_id)
    json(conn, %{data: Enum.map(milestones, &milestone_json/1)})
  end

  def show(conn, %{"id" => id}) do
    milestone = Milestones.get_milestone!(id)
    json(conn, %{data: milestone_detail_json(milestone)})
  end

  @doc """
  Creator submits evidence for a milestone.
  Evidence is stored in DB; hash must match on-chain hash.
  """
  def submit_evidence(conn, %{"campaign_id" => campaign_id, "index" => index} = params) do
    wallet = conn.assigns.current_wallet

    with campaign when not is_nil(campaign) <- Campaigns.get_campaign_by_pubkey(campaign_id) |> nil_or(Campaigns.get_campaign!(campaign_id)),
         true <- campaign.creator_wallet == wallet,
         milestone when not is_nil(milestone) <- Milestones.get_milestone_by_campaign_and_index(campaign.id, String.to_integer(index)) do

      attrs = %{
        evidence_text: params["text"],
        evidence_links: params["links"] || [],
        evidence_files: params["files"] || %{},
        evidence_hash: params["evidence_hash"],
        submitted_at: DateTime.utc_now()
      }

      case Milestones.update_milestone(milestone, attrs) do
        {:ok, updated} ->
          # Transition to voting_active — community votes on this evidence
          case Milestones.transition_state(updated, "voting_active") do
            {:ok, transitioned} ->
              # Notify backers that voting is open
              try do
                QadamBackend.Notifications.Notify.notify_backers(
                  campaign, "vote_opened",
                  "Vote opened on milestone #{milestone.index + 1}",
                  "Evidence submitted for \"#{milestone.title || "Milestone #{milestone.index + 1}"}\". Cast your vote."
                )
              rescue
                _ -> :ok
              end
              json(conn, %{data: milestone_detail_json(transitioned)})
            {:error, _} ->
              # Transition failed but evidence saved — still ok
              json(conn, %{data: milestone_detail_json(updated)})
          end
        {:error, changeset} -> conn |> put_status(:unprocessable_entity) |> json(%{error: format_errors(changeset)})
      end
    else
      false -> conn |> put_status(:forbidden) |> json(%{error: "not_creator"})
      nil -> conn |> put_status(:not_found) |> json(%{error: "not_found"})
    end
  end

  defp nil_or(nil, fallback), do: fallback
  defp nil_or(val, _fallback), do: val

  defp milestone_json(m) do
    %{
      id: m.id,
      index: m.index,
      title: m.title,
      amount_lamports: m.amount_lamports,
      deadline: m.deadline,
      status: m.status
    }
  end

  defp milestone_detail_json(m) do
    milestone_json(m)
    |> Map.merge(%{
      description: m.description,
      acceptance_criteria: m.acceptance_criteria,
      evidence_text: m.evidence_text,
      evidence_links: m.evidence_links,
      submitted_at: m.submitted_at,
      decided_at: m.decided_at
    })
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
