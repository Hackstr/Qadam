defmodule QadamBackend.NotificationsTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.Notifications

  @wallet "NotifWallet1111111111111111111111111111111"

  describe "create/1" do
    test "creates notification" do
      assert {:ok, notif} = Notifications.create(%{
        wallet_address: @wallet,
        type: "milestone_approved",
        title: "Milestone approved!",
        message: "Your milestone was verified by AI"
      })

      assert notif.wallet_address == @wallet
      assert notif.read == false
    end

    test "rejects invalid type" do
      assert {:error, _} = Notifications.create(%{
        wallet_address: @wallet,
        type: "invalid_type",
        title: "Test"
      })
    end
  end

  describe "list_for_wallet/1" do
    test "returns notifications for wallet" do
      Notifications.create(%{wallet_address: @wallet, type: "milestone_approved", title: "First"})
      Notifications.create(%{wallet_address: @wallet, type: "milestone_rejected", title: "Second"})

      notifs = Notifications.list_for_wallet(@wallet)
      assert length(notifs) == 2
      titles = Enum.map(notifs, & &1.title)
      assert "First" in titles
      assert "Second" in titles
    end

    test "returns only for given wallet" do
      Notifications.create(%{wallet_address: @wallet, type: "milestone_approved", title: "Mine"})
      Notifications.create(%{wallet_address: "other_wallet", type: "milestone_approved", title: "Other"})

      notifs = Notifications.list_for_wallet(@wallet)
      assert length(notifs) == 1
    end
  end

  describe "unread_count/1" do
    test "counts unread notifications" do
      Notifications.create(%{wallet_address: @wallet, type: "milestone_approved", title: "A"})
      Notifications.create(%{wallet_address: @wallet, type: "milestone_rejected", title: "B"})

      assert Notifications.unread_count(@wallet) == 2
    end
  end

  describe "mark_all_read/1" do
    test "marks all as read" do
      Notifications.create(%{wallet_address: @wallet, type: "milestone_approved", title: "A"})
      Notifications.create(%{wallet_address: @wallet, type: "vote_opened", title: "B"})

      assert Notifications.unread_count(@wallet) == 2

      Notifications.mark_all_read(@wallet)

      assert Notifications.unread_count(@wallet) == 0
    end
  end
end
