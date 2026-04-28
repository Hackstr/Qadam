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
          bio location socials previous_work
          notify_milestone_approved notify_milestone_rejected
          notify_governance_vote notify_refund_available notify_campaign_updates))

        # If email changed, reset verification and send token
        email_changed = allowed["email"] && allowed["email"] != user.email

        extra =
          if email_changed do
            token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
            %{email_verified: false, email_verification_token: token, email_verification_sent_at: DateTime.utc_now()}
          else
            %{}
          end

        case Accounts.update_user(user, Map.merge(allowed, extra)) do
          {:ok, updated} ->
            if email_changed && updated.email do
              try do
                QadamBackend.Emails.email_verification(updated.email, updated.email_verification_token)
                |> QadamBackend.Mailer.deliver()
              rescue
                _ -> :ok  # Don't fail the update if email sending fails
              end
            end

            json(conn, %{data: user_json(updated)})

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc "Verify email via token link"
  def verify_email(conn, %{"token" => token}) do
    case Accounts.get_user_by_email_token(token) do
      nil ->
        conn |> put_status(:bad_request) |> json(%{error: "Invalid or expired token"})

      user ->
        Accounts.update_user(user, %{email_verified: true, email_verification_token: nil})
        json(conn, %{ok: true, message: "Email verified successfully"})
    end
  end

  defp user_json(user) do
    %{
      id: user.id,
      wallet_address: user.wallet_address,
      display_name: user.display_name,
      email: user.email,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url,
      # Foundation v1 Creator Profile
      bio: user.bio,
      location: user.location,
      socials: user.socials || %{},
      previous_work: user.previous_work || [],
      # Notification preferences
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
