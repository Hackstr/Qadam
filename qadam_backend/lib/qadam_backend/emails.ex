defmodule QadamBackend.Emails do
  @moduledoc """
  Email templates for Qadam notifications.
  Uses Swoosh for delivery (configured adapter in config).
  """
  import Swoosh.Email

  @from {"Qadam", "notifications@qadam.xyz"}

  def milestone_approved(to_email, campaign_title, milestone_title) do
    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Milestone approved: #{milestone_title}")
    |> text_body("""
    Great news! Milestone "#{milestone_title}" for campaign "#{campaign_title}" has been approved by AI verification.

    SOL has been released to the creator. If you're a backer, you can now claim your tokens.

    — Qadam
    """)
  end

  def milestone_rejected(to_email, campaign_title, milestone_title, explanation) do
    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Milestone needs revision: #{milestone_title}")
    |> text_body("""
    Milestone "#{milestone_title}" for campaign "#{campaign_title}" was not approved.

    AI feedback: #{explanation}

    The creator can resubmit evidence or request a human review.

    — Qadam
    """)
  end

  def vote_opened(to_email, campaign_title, milestone_title) do
    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Your vote is needed: #{campaign_title}")
    |> text_body("""
    The creator of "#{campaign_title}" has requested an extension for milestone "#{milestone_title}".

    As a backer, you can vote to extend the deadline or request a refund. Voting is open for 7 days.

    — Qadam
    """)
  end

  def refund_available(to_email, campaign_title) do
    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Refund available: #{campaign_title}")
    |> text_body("""
    Campaign "#{campaign_title}" has been refunded. You can now claim your proportional SOL refund.

    Visit your portfolio to claim.

    — Qadam
    """)
  end

  def email_verification(to_email, token) do
    host = System.get_env("PHX_HOST") || "localhost:4000"
    scheme = if host =~ "localhost", do: "http", else: "https"
    url = "#{scheme}://#{host}/api/auth/verify-email?token=#{token}"

    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Verify your email — Qadam")
    |> text_body("""
    Please verify your email address by clicking the link below:

    #{url}

    If you didn't request this, you can safely ignore this email.

    — Qadam
    """)
  end

  def campaign_update(to_email, campaign_title, update_title, update_content) do
    new()
    |> to(to_email)
    |> from(@from)
    |> subject("Update from #{campaign_title}: #{update_title}")
    |> text_body("""
    New update from the creator of "#{campaign_title}":

    #{update_title}

    #{update_content}

    — Qadam
    """)
  end
end
