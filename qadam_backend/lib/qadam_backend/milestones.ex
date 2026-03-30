defmodule QadamBackend.Milestones do
  @moduledoc """
  The Milestones context — bounded context for milestone lifecycle and state machine.
  """
  import Ecto.Query
  alias Ecto.Multi
  alias QadamBackend.Repo
  alias QadamBackend.Milestones.{Milestone, StateTransition}

  @valid_transitions %{
    "pending" => ~w(grace_period submitted),
    "grace_period" => ~w(submitted failed),
    "submitted" => ~w(ai_processing),
    "ai_processing" => ~w(approved rejected under_human_review),
    "under_human_review" => ~w(approved rejected),
    "rejected" => ~w(submitted extension_requested),
    "extension_requested" => ~w(voting_active),
    "voting_active" => ~w(extended failed),
    "extended" => ~w(submitted grace_period),
    "approved" => [],
    "failed" => ~w(extension_requested)
  }

  def get_milestone!(id), do: Repo.get!(Milestone, id)

  def get_milestone_by_campaign_and_index(campaign_id, index) do
    Repo.get_by(Milestone, campaign_id: campaign_id, index: index)
  end

  def list_milestones_for_campaign(campaign_id) do
    Milestone
    |> where([m], m.campaign_id == ^campaign_id)
    |> order_by(:index)
    |> Repo.all()
  end

  @doc """
  Transition milestone to a new state with validation and audit log.
  Uses Ecto.Multi for atomicity.
  """
  def transition_state(%Milestone{} = milestone, to_state, metadata \\ %{}) do
    from_state = milestone.status

    with :ok <- validate_transition(from_state, to_state) do
      Multi.new()
      |> Multi.update(:milestone, Milestone.changeset(milestone, %{status: to_state}))
      |> Multi.insert(:transition, fn _changes ->
        StateTransition.changeset(%StateTransition{}, %{
          milestone_id: milestone.id,
          from_state: from_state,
          to_state: to_state,
          metadata: metadata
        })
      end)
      |> Repo.transaction()
    end
  end

  def update_milestone(%Milestone{} = milestone, attrs) do
    milestone
    |> Milestone.changeset(attrs)
    |> Repo.update()
  end

  def get_overdue_milestones do
    now = DateTime.utc_now()

    Milestone
    |> where([m], m.status == "pending" and m.deadline < ^now)
    |> Repo.all()
  end

  def get_past_grace_milestones do
    now = DateTime.utc_now()

    Milestone
    |> where([m], m.status in ["pending", "grace_period"] and m.grace_deadline < ^now)
    |> Repo.all()
  end

  defp validate_transition(from_state, to_state) do
    allowed = Map.get(@valid_transitions, from_state, [])

    if to_state in allowed do
      :ok
    else
      {:error, {:invalid_transition, from_state, to_state}}
    end
  end
end
