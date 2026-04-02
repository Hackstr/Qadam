defmodule QadamBackend.MilestonesTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.Milestones
  alias QadamBackend.Campaigns

  defp create_campaign_with_milestone do
    {:ok, campaign} = Campaigns.create_campaign(%{
      solana_pubkey: "ms_test_#{:rand.uniform(999999)}",
      creator_wallet: "MsCreator111111111111111111111111111111111",
      title: "Milestone Test",
      goal_lamports: 10_000_000_000,
      milestones_count: 2,
      status: "active"
    })

    {:ok, milestone} = Repo.insert(%QadamBackend.Milestones.Milestone{
      campaign_id: campaign.id,
      index: 0,
      amount_lamports: 5_000_000_000,
      deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 7 * 86400, :second),
      grace_deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 14 * 86400, :second),
      status: "pending"
    })

    {campaign, milestone}
  end

  describe "state machine transitions" do
    test "pending → submitted is valid" do
      {_campaign, milestone} = create_campaign_with_milestone()
      assert {:ok, %{milestone: updated}} = Milestones.transition_state(milestone, "submitted")
      assert updated.status == "submitted"
    end

    test "pending → approved is invalid" do
      {_campaign, milestone} = create_campaign_with_milestone()
      assert {:error, {:invalid_transition, "pending", "approved"}} =
        Milestones.transition_state(milestone, "approved")
    end

    test "submitted → ai_processing is valid" do
      {_campaign, milestone} = create_campaign_with_milestone()
      {:ok, %{milestone: submitted}} = Milestones.transition_state(milestone, "submitted")
      assert {:ok, %{milestone: processing}} = Milestones.transition_state(submitted, "ai_processing")
      assert processing.status == "ai_processing"
    end

    test "ai_processing → approved is valid" do
      {_campaign, milestone} = create_campaign_with_milestone()
      {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "ai_processing")
      assert {:ok, %{milestone: approved}} = Milestones.transition_state(m, "approved")
      assert approved.status == "approved"
    end

    test "ai_processing → under_human_review is valid" do
      {_campaign, milestone} = create_campaign_with_milestone()
      {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "ai_processing")
      assert {:ok, %{milestone: review}} = Milestones.transition_state(m, "under_human_review")
      assert review.status == "under_human_review"
    end

    test "rejected → submitted is valid (re-submit)" do
      {_campaign, milestone} = create_campaign_with_milestone()
      {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "ai_processing")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "rejected")
      assert {:ok, %{milestone: resubmit}} = Milestones.transition_state(m, "submitted")
      assert resubmit.status == "submitted"
    end

    test "transition creates audit log" do
      {_campaign, milestone} = create_campaign_with_milestone()
      {:ok, %{milestone: _, transition: log}} = Milestones.transition_state(milestone, "submitted")
      assert log.from_state == "pending"
      assert log.to_state == "submitted"
    end
  end

  describe "queries" do
    test "list_milestones_for_campaign" do
      {campaign, _milestone} = create_campaign_with_milestone()
      milestones = Milestones.list_milestones_for_campaign(campaign.id)
      assert length(milestones) == 1
    end

    test "get_milestone_by_campaign_and_index" do
      {campaign, milestone} = create_campaign_with_milestone()
      found = Milestones.get_milestone_by_campaign_and_index(campaign.id, 0)
      assert found.id == milestone.id
    end
  end
end
