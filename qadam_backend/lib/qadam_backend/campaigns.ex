defmodule QadamBackend.Campaigns do
  @moduledoc """
  The Campaigns context — bounded context for campaign lifecycle.
  """
  import Ecto.Query
  alias QadamBackend.Repo
  alias QadamBackend.Campaigns.{Campaign, CampaignUpdate}

  def list_campaigns(opts \\ []) do
    Campaign
    |> filter_by_status(opts[:status])
    |> filter_by_category(opts[:category])
    |> filter_by_creator(opts[:creator_wallet])
    |> order_by(desc: :inserted_at)
    |> maybe_limit(opts[:limit])
    |> Repo.all()
  end

  def get_campaign!(id), do: Repo.get!(Campaign, id)

  def get_campaign_by_pubkey(pubkey) do
    Repo.get_by(Campaign, solana_pubkey: pubkey)
  end

  def create_campaign(attrs) do
    %Campaign{}
    |> Campaign.changeset(attrs)
    |> Repo.insert()
  end

  def update_campaign(%Campaign{} = campaign, attrs) do
    campaign
    |> Campaign.changeset(attrs)
    |> Repo.update()
  end

  def get_campaign_with_milestones(id) do
    Campaign
    |> Repo.get(id)
    |> Repo.preload(milestones: from(m in QadamBackend.Milestones.Milestone, order_by: m.index))
  end

  # Private filters

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status), do: where(query, [c], c.status == ^status)

  defp filter_by_category(query, nil), do: query
  defp filter_by_category(query, category), do: where(query, [c], c.category == ^category)

  defp filter_by_creator(query, nil), do: query
  defp filter_by_creator(query, wallet), do: where(query, [c], c.creator_wallet == ^wallet)

  defp maybe_limit(query, nil), do: query
  defp maybe_limit(query, limit), do: limit(query, ^limit)

  # Campaign Updates

  def list_updates_for_campaign(campaign_id) do
    CampaignUpdate
    |> where([u], u.campaign_id == ^campaign_id)
    |> order_by(desc: :inserted_at)
    |> Repo.all()
  end

  def create_update(attrs) do
    %CampaignUpdate{}
    |> CampaignUpdate.changeset(attrs)
    |> Repo.insert()
  end
end
