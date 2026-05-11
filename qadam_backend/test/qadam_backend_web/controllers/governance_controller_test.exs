defmodule QadamBackendWeb.GovernanceControllerTest do
  use QadamBackendWeb.ConnCase, async: true

  alias QadamBackend.{Campaigns, Milestones, Repo}
  alias QadamBackend.Governance.ExtensionVote

  @campaign_wallet "GovCreator111111111111111111111111111111111"
  @backer_wallet "GovBacker111111111111111111111111111111111"

  defp create_voting_milestone do
    {:ok, campaign} = Campaigns.create_campaign(%{
      solana_pubkey: "gov_test_#{:rand.uniform(999999)}",
      creator_wallet: @campaign_wallet,
      title: "Governance Test Campaign",
      goal_lamports: 10_000_000_000,
      milestones_count: 1,
      status: "active",
      vote_period_days: 7
    })

    {:ok, milestone} = Repo.insert(%Milestones.Milestone{
      campaign_id: campaign.id,
      index: 0,
      amount_lamports: 10_000_000_000,
      deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 7 * 86400, :second),
      grace_deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 14 * 86400, :second),
      status: "pending"
    })

    # Transition to voting_active
    {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
    {:ok, %{milestone: voting}} = Milestones.transition_state(m, "voting_active")

    {campaign, voting}
  end

  describe "GET /api/campaigns/:campaign_id/votes" do
    test "returns active votes for campaign", %{conn: conn} do
      {campaign, milestone} = create_voting_milestone()

      conn = get(conn, "/api/campaigns/#{campaign.id}/votes")
      assert %{"data" => data} = json_response(conn, 200)
      assert length(data) == 1
      [vote_data] = data
      assert vote_data["milestone_id"] == milestone.id
      assert vote_data["status"] == "voting_active"
      assert vote_data["votes_count"] == 0
    end

    test "returns empty list for campaign with no active votes", %{conn: conn} do
      {:ok, campaign} = Campaigns.create_campaign(%{
        solana_pubkey: "gov_empty_#{:rand.uniform(999999)}",
        creator_wallet: @campaign_wallet,
        title: "No Votes Campaign",
        goal_lamports: 5_000_000_000,
        milestones_count: 1,
        status: "active"
      })

      conn = get(conn, "/api/campaigns/#{campaign.id}/votes")
      assert %{"data" => []} = json_response(conn, 200)
    end

    test "includes vote tallies when votes exist", %{conn: conn} do
      {campaign, milestone} = create_voting_milestone()

      # Add some votes
      Repo.insert!(%ExtensionVote{
        milestone_id: milestone.id,
        voter_wallet: @backer_wallet,
        voting_power: 100,
        vote_approve: true
      })
      Repo.insert!(%ExtensionVote{
        milestone_id: milestone.id,
        voter_wallet: "GovBacker222222222222222222222222222222222",
        voting_power: 50,
        vote_approve: false
      })

      conn = get(conn, "/api/campaigns/#{campaign.id}/votes")
      assert %{"data" => [vote_data]} = json_response(conn, 200)
      assert vote_data["votes_count"] == 2
      assert vote_data["total_approve"] == 100
      assert vote_data["total_reject"] == 50
    end
  end
end
