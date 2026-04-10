defmodule QadamBackendWeb.BackerController do
  use QadamBackendWeb, :controller

  import Ecto.Query
  alias QadamBackend.{Backers, Repo}
  alias QadamBackend.Milestones.Milestone

  @doc "Backer's portfolio — all backed campaigns"
  def portfolio(conn, _params) do
    wallet = conn.assigns.current_wallet
    positions = Backers.list_positions_for_wallet(wallet)

    json(conn, %{
      data: Enum.map(positions, fn p ->
        %{
          campaign_id: p.campaign_id,
          campaign_pubkey: p.campaign && p.campaign.solana_pubkey,
          campaign_title: p.campaign && p.campaign.title,
          campaign_status: p.campaign && p.campaign.status,
          milestones_count: p.campaign && p.campaign.milestones_count,
          milestones_approved: p.campaign && p.campaign.milestones_approved,
          amount_lamports: p.amount_lamports,
          tokens_allocated: p.tokens_allocated,
          tokens_claimed: p.tokens_claimed,
          tier: p.tier,
          refund_claimed: p.refund_claimed,
          wallet_address: p.wallet_address,
          has_active_vote: has_active_vote?(p.campaign_id),
          backed_at: p.inserted_at
        }
      end)
    })
  end

  defp has_active_vote?(nil), do: false
  defp has_active_vote?(campaign_id) do
    Milestone
    |> where([m], m.campaign_id == ^campaign_id and m.status == "voting_active")
    |> Repo.exists?()
  end
end
