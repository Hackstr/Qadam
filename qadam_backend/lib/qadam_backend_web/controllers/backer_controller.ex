defmodule QadamBackendWeb.BackerController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Backers

  @doc "Backer's portfolio — all backed campaigns"
  def portfolio(conn, _params) do
    wallet = conn.assigns.current_wallet
    positions = Backers.list_positions_for_wallet(wallet)

    json(conn, %{
      data: Enum.map(positions, fn p ->
        %{
          campaign_id: p.campaign_id,
          campaign_title: p.campaign && p.campaign.title,
          campaign_status: p.campaign && p.campaign.status,
          amount_lamports: p.amount_lamports,
          tokens_allocated: p.tokens_allocated,
          tokens_claimed: p.tokens_claimed,
          tier: p.tier,
          refund_claimed: p.refund_claimed,
          backed_at: p.inserted_at
        }
      end)
    })
  end
end
