defmodule QadamBackend.CampaignsTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.Campaigns
  alias QadamBackend.Campaigns.Campaign

  @valid_attrs %{
    solana_pubkey: "campaign_test_001",
    creator_wallet: "CreatorWallet11111111111111111111111111111",
    title: "Test Campaign",
    description: "A test campaign for unit tests",
    category: "Apps",
    goal_lamports: 10_000_000_000,
    milestones_count: 3,
    status: "active",
    tokens_per_lamport: 100
  }

  defp create_campaign(attrs \\ %{}) do
    {:ok, campaign} = Campaigns.create_campaign(Map.merge(@valid_attrs, attrs))
    campaign
  end

  describe "create_campaign/1" do
    test "creates campaign with valid attrs" do
      assert {:ok, %Campaign{} = c} = Campaigns.create_campaign(@valid_attrs)
      assert c.title == "Test Campaign"
      assert c.status == "active"
      assert c.goal_lamports == 10_000_000_000
    end

    test "rejects missing required fields" do
      assert {:error, changeset} = Campaigns.create_campaign(%{})
      errors = errors_on(changeset)
      assert errors.solana_pubkey
      assert errors.creator_wallet
      assert errors.title
    end

    test "rejects invalid status" do
      assert {:error, changeset} = Campaigns.create_campaign(Map.put(@valid_attrs, :status, "invalid"))
      assert errors_on(changeset).status
    end

    test "rejects duplicate solana_pubkey" do
      create_campaign()
      assert {:error, changeset} = Campaigns.create_campaign(@valid_attrs)
      assert errors_on(changeset).solana_pubkey
    end
  end

  describe "list_campaigns/1" do
    test "returns all campaigns" do
      create_campaign(%{solana_pubkey: "list_1"})
      create_campaign(%{solana_pubkey: "list_2"})
      assert length(Campaigns.list_campaigns()) == 2
    end

    test "filters by status" do
      create_campaign(%{solana_pubkey: "active_1", status: "active"})
      create_campaign(%{solana_pubkey: "completed_1", status: "completed"})

      active = Campaigns.list_campaigns(status: "active")
      assert length(active) == 1
      assert hd(active).status == "active"
    end

    test "filters by category" do
      create_campaign(%{solana_pubkey: "apps_1", category: "Apps"})
      create_campaign(%{solana_pubkey: "games_1", category: "Games"})

      apps = Campaigns.list_campaigns(category: "Apps")
      assert length(apps) == 1
      assert hd(apps).category == "Apps"
    end

    test "sorts by trending (raised_lamports desc)" do
      create_campaign(%{solana_pubkey: "low_1", raised_lamports: 100})
      create_campaign(%{solana_pubkey: "high_1", raised_lamports: 999})

      sorted = Campaigns.list_campaigns(sort: "trending")
      assert hd(sorted).raised_lamports == 999
    end

    test "respects limit" do
      for i <- 1..5 do
        create_campaign(%{solana_pubkey: "limit_#{i}"})
      end
      assert length(Campaigns.list_campaigns(limit: 2)) == 2
    end
  end

  describe "update_campaign/2" do
    test "updates campaign fields" do
      campaign = create_campaign()
      {:ok, updated} = Campaigns.update_campaign(campaign, %{raised_lamports: 5_000_000_000})
      assert updated.raised_lamports == 5_000_000_000
    end
  end

  describe "campaign_updates" do
    test "creates and lists updates" do
      campaign = create_campaign()

      {:ok, update} = Campaigns.create_update(%{
        campaign_id: campaign.id,
        author_wallet: campaign.creator_wallet,
        title: "Progress Update",
        content: "Milestone 1 is 50% complete"
      })

      assert update.title == "Progress Update"

      updates = Campaigns.list_updates_for_campaign(campaign.id)
      assert length(updates) == 1
    end
  end
end
