defmodule QadamBackend.Workers.NotificationWorker do
  @moduledoc """
  Oban worker: creates in-app notification + sends email if user has email configured.
  """
  use Oban.Worker, queue: :notifications, max_attempts: 3

  alias QadamBackend.{Notifications, Accounts, Emails, Mailer}
  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    %{
      "wallet_address" => wallet,
      "type" => type,
      "title" => title,
    } = args
    message = args["message"]
    campaign_id = args["campaign_id"]

    # 1. Create in-app notification
    Notifications.create(%{
      wallet_address: wallet,
      type: type,
      title: title,
      message: message,
      campaign_id: campaign_id,
    })

    # 2. Send email if user has email and notification pref enabled
    case Accounts.get_user_by_wallet(wallet) do
      %{email: email} = user when is_binary(email) and email != "" ->
        if should_notify?(user, type) do
          email_fn = email_for_type(type, args)
          if email_fn do
            Mailer.deliver(email_fn.(email))
            Logger.info("[Notify] Email sent to #{email} for #{type}")
          end
        end

      _ ->
        :ok
    end

    :ok
  end

  defp should_notify?(user, "milestone_approved"), do: user.notify_milestone_approved
  defp should_notify?(user, "milestone_rejected"), do: user.notify_milestone_rejected
  defp should_notify?(user, "vote_opened"), do: user.notify_governance_vote
  defp should_notify?(user, "refund_available"), do: user.notify_refund_available
  defp should_notify?(user, "campaign_update"), do: user.notify_campaign_updates
  defp should_notify?(_user, _type), do: true

  defp email_for_type("milestone_approved", args) do
    fn email -> Emails.milestone_approved(email, args["campaign_title"] || "", args["milestone_title"] || "") end
  end

  defp email_for_type("milestone_rejected", args) do
    fn email -> Emails.milestone_rejected(email, args["campaign_title"] || "", args["milestone_title"] || "", args["explanation"] || "") end
  end

  defp email_for_type("vote_opened", args) do
    fn email -> Emails.vote_opened(email, args["campaign_title"] || "", args["milestone_title"] || "") end
  end

  defp email_for_type("refund_available", args) do
    fn email -> Emails.refund_available(email, args["campaign_title"] || "") end
  end

  defp email_for_type("campaign_update", args) do
    fn email -> Emails.campaign_update(email, args["campaign_title"] || "", args["update_title"] || "", args["update_content"] || "") end
  end

  defp email_for_type(_type, _args), do: nil
end
