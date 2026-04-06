defmodule QadamBackendWeb.Router do
  use QadamBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug QadamBackendWeb.Plugs.AuthPlug
  end

  pipeline :admin do
    plug QadamBackendWeb.Plugs.AuthPlug
    plug QadamBackendWeb.Plugs.AdminPlug
  end

  # ═══════════════════════════════════════════
  # PUBLIC API
  # ═══════════════════════════════════════════

  scope "/api", QadamBackendWeb do
    pipe_through :api

    # Health check
    get "/health", AdminController, :health

    # Auth
    get "/auth/nonce", AuthController, :nonce
    post "/auth/verify", AuthController, :verify

    # Campaign discovery (public)
    get "/campaigns", CampaignController, :index
    get "/campaigns/:id", CampaignController, :show
    get "/campaigns/:id/backers", CampaignController, :backers
    get "/campaigns/:campaign_id/milestones", MilestoneController, :index
    get "/milestones/:id", MilestoneController, :show

    # Campaign updates (public read)
    get "/campaigns/:campaign_id/updates", UpdateController, :index

    # Governance votes (public read)
    get "/campaigns/:campaign_id/votes", GovernanceController, :active_votes

    # Public creator profile
    get "/profiles/:wallet", ProfileController, :show

    # Analytics summary
    get "/analytics/summary", AnalyticsController, :summary
  end

  # ═══════════════════════════════════════════
  # AUTHENTICATED API
  # ═══════════════════════════════════════════

  scope "/api", QadamBackendWeb do
    pipe_through [:api, :authenticated]

    # User account
    get "/me", UserController, :me
    put "/me", UserController, :update

    # Backer portfolio
    get "/portfolio", BackerController, :portfolio

    # Creator: submit evidence
    post "/campaigns/:campaign_id/milestones/:index/evidence", MilestoneController, :submit_evidence

    # Creator: post update
    post "/campaigns/:campaign_id/updates", UpdateController, :create

    # Governance: check my vote
    get "/milestones/:milestone_id/my-vote", GovernanceController, :my_vote

    # Webhook: trigger AI verification after on-chain submit
    post "/webhooks/milestone-submitted", WebhookController, :milestone_submitted

    # Notifications
    get "/notifications", NotificationController, :index
    post "/notifications/mark-read", NotificationController, :mark_read
  end

  # ═══════════════════════════════════════════
  # ADMIN API
  # ═══════════════════════════════════════════

  scope "/api/admin", QadamBackendWeb do
    pipe_through [:api, :admin]

    get "/review-queue", AdminController, :review_queue
    post "/milestones/:id/decide", AdminController, :decide
    post "/campaigns/:id/feature", AdminController, :set_featured
  end

  # Dev routes
  if Application.compile_env(:qadam_backend, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: QadamBackendWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
