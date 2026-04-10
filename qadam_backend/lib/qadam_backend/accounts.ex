defmodule QadamBackend.Accounts do
  @moduledoc """
  The Accounts context — user identity, preferences, and verification.
  """
  alias QadamBackend.Repo
  alias QadamBackend.Accounts.User

  def get_user_by_wallet(wallet_address) do
    Repo.get_by(User, wallet_address: wallet_address)
  end

  def get_or_create_user(wallet_address) do
    case get_user_by_wallet(wallet_address) do
      nil ->
        %User{}
        |> User.changeset(%{wallet_address: wallet_address})
        |> Repo.insert()

      user ->
        {:ok, user}
    end
  end

  def get_user_by_email_token(token) when is_binary(token) do
    Repo.get_by(User, email_verification_token: token)
  end
  def get_user_by_email_token(_), do: nil

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end
end
