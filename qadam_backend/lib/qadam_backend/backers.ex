defmodule QadamBackend.Backers do
  @moduledoc """
  The Backers context — bounded context for backer positions and portfolio.
  """
  import Ecto.Query
  alias QadamBackend.Repo
  alias QadamBackend.Backers.BackerPosition

  def get_position!(id), do: Repo.get!(BackerPosition, id)

  def get_position_by_campaign_and_wallet(campaign_id, wallet) do
    Repo.get_by(BackerPosition, campaign_id: campaign_id, wallet_address: wallet)
  end

  def list_positions_for_campaign(campaign_id) do
    BackerPosition
    |> where([b], b.campaign_id == ^campaign_id)
    |> order_by(desc: :amount_lamports)
    |> Repo.all()
  end

  def list_positions_for_wallet(wallet_address) do
    BackerPosition
    |> where([b], b.wallet_address == ^wallet_address)
    |> preload(:campaign)
    |> order_by(desc: :inserted_at)
    |> Repo.all()
  end

  def create_position(attrs) do
    %BackerPosition{}
    |> BackerPosition.changeset(attrs)
    |> Repo.insert()
  end

  def update_position(%BackerPosition{} = position, attrs) do
    position
    |> BackerPosition.changeset(attrs)
    |> Repo.update()
  end
end
