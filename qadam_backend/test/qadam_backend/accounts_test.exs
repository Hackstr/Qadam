defmodule QadamBackend.AccountsTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.Accounts
  alias QadamBackend.Accounts.User

  @wallet "TestWallet111111111111111111111111111111111"

  describe "get_or_create_user/1" do
    test "creates new user for unknown wallet" do
      assert {:ok, %User{} = user} = Accounts.get_or_create_user(@wallet)
      assert user.wallet_address == @wallet
      assert user.display_name == nil
      assert user.email == nil
    end

    test "returns existing user for known wallet" do
      {:ok, original} = Accounts.get_or_create_user(@wallet)
      {:ok, found} = Accounts.get_or_create_user(@wallet)
      assert found.id == original.id
    end
  end

  describe "update_user/2" do
    test "updates display_name and email" do
      {:ok, user} = Accounts.get_or_create_user(@wallet)

      {:ok, updated} = Accounts.update_user(user, %{
        display_name: "Alice",
        email: "alice@example.com"
      })

      assert updated.display_name == "Alice"
      assert updated.email == "alice@example.com"
    end

    test "updates notification preferences" do
      {:ok, user} = Accounts.get_or_create_user(@wallet)

      {:ok, updated} = Accounts.update_user(user, %{
        notify_milestone_approved: false,
        notify_governance_vote: false
      })

      assert updated.notify_milestone_approved == false
      assert updated.notify_governance_vote == false
      # Others stay default true
      assert updated.notify_milestone_rejected == true
    end

    test "rejects invalid email format" do
      {:ok, user} = Accounts.get_or_create_user(@wallet)
      assert {:error, changeset} = Accounts.update_user(user, %{email: "not-an-email"})
      assert errors_on(changeset).email != nil
    end

    test "rejects too long display_name" do
      {:ok, user} = Accounts.get_or_create_user(@wallet)
      long_name = String.duplicate("a", 51)
      assert {:error, changeset} = Accounts.update_user(user, %{display_name: long_name})
      assert errors_on(changeset).display_name != nil
    end
  end

  describe "get_user_by_wallet/1" do
    test "returns nil for unknown wallet" do
      assert Accounts.get_user_by_wallet("unknown") == nil
    end

    test "returns user for known wallet" do
      {:ok, _} = Accounts.get_or_create_user(@wallet)
      assert %User{} = Accounts.get_user_by_wallet(@wallet)
    end
  end
end
