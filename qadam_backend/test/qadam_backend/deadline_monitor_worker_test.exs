defmodule QadamBackend.Workers.DeadlineMonitorWorkerTest do
  use QadamBackend.DataCase, async: true

  alias QadamBackend.{Campaigns, Milestones, Repo}
  alias QadamBackend.Workers.DeadlineMonitorWorker

  defp create_campaign(attrs \\ %{}) do
    defaults = %{
      solana_pubkey: "dm_test_#{:rand.uniform(999999)}",
      creator_wallet: "DmCreator111111111111111111111111111111111",
      title: "Deadline Monitor Test",
      goal_lamports: 10_000_000_000,
      milestones_count: 2,
      status: "active",
      vote_period_days: 7
    }
    {:ok, campaign} = Campaigns.create_campaign(Map.merge(defaults, attrs))
    campaign
  end

  defp create_milestone(campaign, attrs \\ %{}) do
    defaults = %{
      campaign_id: campaign.id,
      index: 0,
      amount_lamports: 5_000_000_000,
      deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 7 * 86400, :second),
      grace_deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 14 * 86400, :second),
      status: "pending"
    }
    {:ok, milestone} = Repo.insert(struct(Milestones.Milestone, Map.merge(defaults, attrs)))
    milestone
  end

  describe "perform/1 — overdue pending → grace_period" do
    test "transitions pending milestone past deadline to grace_period" do
      campaign = create_campaign()
      _milestone = create_milestone(campaign, %{
        deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), -1 * 86400, :second),
        grace_deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 6 * 86400, :second)
      })

      assert :ok = DeadlineMonitorWorker.perform(%Oban.Job{})

      updated = Milestones.list_milestones_for_campaign(campaign.id) |> List.first()
      assert updated.status == "grace_period"
    end

    test "does not touch pending milestone before deadline" do
      campaign = create_campaign()
      _milestone = create_milestone(campaign, %{
        deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), 3 * 86400, :second)
      })

      assert :ok = DeadlineMonitorWorker.perform(%Oban.Job{})

      updated = Milestones.list_milestones_for_campaign(campaign.id) |> List.first()
      assert updated.status == "pending"
    end
  end

  describe "perform/1 — past grace → failed" do
    test "transitions grace_period milestone past grace_deadline to failed" do
      campaign = create_campaign()
      milestone = create_milestone(campaign, %{
        deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), -14 * 86400, :second),
        grace_deadline: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), -1 * 86400, :second),
        status: "pending"
      })
      # First transition to grace_period
      {:ok, %{milestone: gp}} = Milestones.transition_state(milestone, "grace_period", %{reason: "test"})

      assert :ok = DeadlineMonitorWorker.perform(%Oban.Job{})

      updated = Repo.get!(Milestones.Milestone, gp.id)
      assert updated.status == "failed"
    end
  end

  describe "perform/1 — expired voting → auto-approve" do
    test "auto-approves voting_active milestone past vote deadline" do
      campaign = create_campaign(%{vote_period_days: 3})
      milestone = create_milestone(campaign)
      # Transition to voting_active
      {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "voting_active")
      # Backdate submitted_at to make vote period expired (3 days + 1 day buffer)
      Repo.update!(Ecto.Changeset.change(m, %{
        submitted_at: DateTime.add(DateTime.utc_now() |> DateTime.truncate(:second), -4 * 86400, :second)
      }))

      assert :ok = DeadlineMonitorWorker.perform(%Oban.Job{})

      updated = Repo.get!(Milestones.Milestone, m.id)
      assert updated.status == "approved"
    end

    test "does not auto-approve voting_active milestone within vote period" do
      campaign = create_campaign(%{vote_period_days: 7})
      milestone = create_milestone(campaign)
      {:ok, %{milestone: m}} = Milestones.transition_state(milestone, "submitted")
      {:ok, %{milestone: m}} = Milestones.transition_state(m, "voting_active")

      assert :ok = DeadlineMonitorWorker.perform(%Oban.Job{})

      updated = Repo.get!(Milestones.Milestone, m.id)
      assert updated.status == "voting_active"
    end
  end
end
