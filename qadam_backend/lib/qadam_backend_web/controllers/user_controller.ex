defmodule QadamBackendWeb.UserController do
  use QadamBackendWeb, :controller

  alias QadamBackend.Accounts

  action_fallback QadamBackendWeb.FallbackController

  @doc "Get or create current user (by wallet from JWT)"
  def me(conn, _params) do
    wallet = conn.assigns.current_wallet

    case Accounts.get_or_create_user(wallet) do
      {:ok, user} -> json(conn, %{data: user_json(user)})
      {:error, changeset} -> {:error, changeset}
    end
  end

  @doc "Update current user profile and preferences"
  def update(conn, params) do
    wallet = conn.assigns.current_wallet

    case Accounts.get_user_by_wallet(wallet) do
      nil ->
        {:error, :not_found}

      user ->
        allowed = Map.take(params, ~w(display_name email avatar_url
          notify_milestone_approved notify_milestone_rejected
          notify_governance_vote notify_refund_available notify_campaign_updates))

        case Accounts.update_user(user, allowed) do
          {:ok, updated} -> json(conn, %{data: user_json(updated)})
          {:error, changeset} -> {:error, changeset}
        end
    end
  end

  defp user_json(user) do
    %{
      id: user.id,
      wallet_address: user.wallet_address,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      notify_milestone_approved: user.notify_milestone_approved,
      notify_milestone_rejected: user.notify_milestone_rejected,
      notify_governance_vote: user.notify_governance_vote,
      notify_refund_available: user.notify_refund_available,
      notify_campaign_updates: user.notify_campaign_updates,
      github_username: user.github_username,
      github_verified: user.github_verified,
      inserted_at: user.inserted_at,
    }
  end
end
