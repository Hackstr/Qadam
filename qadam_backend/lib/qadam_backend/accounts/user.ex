defmodule QadamBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "users" do
    field :wallet_address, :string
    field :display_name, :string
    field :email, :string
    field :avatar_url, :string

    # Notification preferences
    field :notify_milestone_approved, :boolean, default: true
    field :notify_milestone_rejected, :boolean, default: true
    field :notify_governance_vote, :boolean, default: true
    field :notify_refund_available, :boolean, default: true
    field :notify_campaign_updates, :boolean, default: true

    # Creator Profile (Foundation v1)
    field :bio, :string
    field :location, :string
    field :socials, :map, default: %{}
    field :previous_work, {:array, :map}, default: []

    # Verification
    field :github_username, :string
    field :github_verified, :boolean, default: false
    field :email_verified, :boolean, default: false
    field :email_verification_token, :string
    field :email_verification_sent_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(wallet_address)a
  @optional_fields ~w(display_name email avatar_url bio location socials previous_work
                      notify_milestone_approved notify_milestone_rejected
                      notify_governance_vote notify_refund_available
                      notify_campaign_updates github_username github_verified
                      email_verified email_verification_token email_verification_sent_at)a

  def changeset(user, attrs) do
    user
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:display_name, max: 50)
    |> validate_length(:bio, max: 280)
    |> unique_constraint(:wallet_address)
    |> unique_constraint(:email)
  end

  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, ~w(display_name avatar_url bio location socials previous_work)a)
    |> validate_required(~w(display_name)a)
    |> validate_length(:display_name, min: 1, max: 50)
    |> validate_length(:bio, max: 280)
  end
end
