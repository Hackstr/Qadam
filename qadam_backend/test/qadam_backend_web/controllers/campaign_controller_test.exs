defmodule QadamBackendWeb.CampaignControllerTest do
  use QadamBackendWeb.ConnCase, async: true

  alias QadamBackend.Campaigns

  setup do
    {:ok, campaign} = Campaigns.create_campaign(%{
      solana_pubkey: "ctrl_test_#{:rand.uniform(999999)}",
      creator_wallet: "CtrlCreator11111111111111111111111111111",
      title: "Controller Test Campaign",
      description: "Testing the API",
      category: "Tools",
      goal_lamports: 5_000_000_000,
      raised_lamports: 2_000_000_000,
      backers_count: 10,
      milestones_count: 2,
      status: "active"
    })

    %{campaign: campaign}
  end

  describe "GET /api/campaigns" do
    test "returns list of campaigns", %{conn: conn} do
      conn = get(conn, "/api/campaigns")
      assert %{"data" => campaigns} = json_response(conn, 200)
      assert is_list(campaigns)
      assert length(campaigns) >= 1
    end

    test "filters by status", %{conn: conn} do
      conn = get(conn, "/api/campaigns?status=active")
      assert %{"data" => campaigns} = json_response(conn, 200)
      assert Enum.all?(campaigns, &(&1["status"] == "active"))
    end

    test "filters by category", %{conn: conn} do
      conn = get(conn, "/api/campaigns?category=Tools")
      assert %{"data" => campaigns} = json_response(conn, 200)
      assert Enum.all?(campaigns, &(&1["category"] == "Tools"))
    end

    test "supports sort parameter", %{conn: conn} do
      conn = get(conn, "/api/campaigns?sort=trending")
      assert %{"data" => _} = json_response(conn, 200)
    end
  end

  describe "GET /api/campaigns/:id" do
    test "returns campaign with milestones", %{conn: conn, campaign: campaign} do
      conn = get(conn, "/api/campaigns/#{campaign.id}")
      assert %{"data" => data} = json_response(conn, 200)
      assert data["title"] == "Controller Test Campaign"
      assert is_list(data["milestones"])
    end

    test "returns 404 for unknown id", %{conn: conn} do
      conn = get(conn, "/api/campaigns/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end
  end

  describe "GET /api/health" do
    test "returns ok", %{conn: conn} do
      conn = get(conn, "/api/health")
      assert %{"status" => "ok"} = json_response(conn, 200)
    end
  end

  describe "GET /api/analytics/summary" do
    test "returns platform stats", %{conn: conn} do
      conn = get(conn, "/api/analytics/summary")
      assert %{"data" => data} = json_response(conn, 200)
      assert is_integer(data["total_campaigns"])
      assert is_integer(data["total_backers"])
      assert data["total_raised_lamports"]
    end
  end
end
