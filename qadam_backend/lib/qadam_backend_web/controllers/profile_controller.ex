defmodule QadamBackendWeb.ProfileController do
  use QadamBackendWeb, :controller
  import Ecto.Query

  alias QadamBackend.Repo
  alias QadamBackend.Accounts
  alias QadamBackend.Campaigns.Campaign
  alias QadamBackend.Reputation.CreatorReputation

  action_fallback QadamBackendWeb.FallbackController

  def show(conn, %{"wallet" => wallet}) do
    user = Accounts.get_user_by_wallet(wallet)
    reputation = Repo.get_by(CreatorReputation, wallet_address: wallet)

    campaigns =
      Campaign
      |> where([c], c.creator_wallet == ^wallet)
      |> order_by(desc: :inserted_at)
      |> Repo.all()

    backed_count =
      QadamBackend.Backers.BackerPosition
      |> where([b], b.wallet_address == ^wallet)
      |> Repo.aggregate(:count)

    json(conn, %{
      data: %{
        wallet_address: wallet,
        display_name: user && user.display_name,
        avatar_url: user && user.avatar_url,
        github_username: user && user.github_username,
        github_verified: (user && user.github_verified) || false,
        reputation: reputation && %{
          score: reputation.score,
          milestones_on_time: reputation.milestones_on_time,
          milestones_late: reputation.milestones_late,
          campaigns_completed: reputation.campaigns_completed,
          campaigns_refunded: reputation.campaigns_refunded,
        },
        campaigns: Enum.map(campaigns, fn c ->
          %{
            id: c.id,
            title: c.title,
            status: c.status,
            category: c.category,
            goal_lamports: c.goal_lamports,
            raised_lamports: c.raised_lamports,
            backers_count: c.backers_count,
            milestones_count: c.milestones_count,
            milestones_approved: c.milestones_approved,
          }
        end),
        campaigns_count: length(campaigns),
        backed_count: backed_count,
        member_since: user && user.inserted_at,
      }
    })
  end
end
