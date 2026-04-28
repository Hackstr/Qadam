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
    get "/auth/verify-email", UserController, :verify_email

    # Campaign discovery (public)
    get "/campaigns", CampaignController, :index
    get "/campaigns/:id", CampaignController, :show
    get "/campaigns/:id/backers", CampaignController, :backers
    get "/campaigns/:campaign_id/milestones", MilestoneController, :index
    get "/milestones/:id", MilestoneController, :show

    # Milestone comments (public read)
    get "/milestones/:milestone_id/comments", CommentController, :index

    # Campaign updates (public read)
    get "/campaigns/:campaign_id/updates", UpdateController, :index

    # Governance votes (public read)
    get "/campaigns/:campaign_id/votes", GovernanceController, :active_votes

    # Public creator profile
    get "/profiles/:wallet", ProfileController, :show

    # Analytics summary
    get "/analytics/summary", AnalyticsController, :summary

    # Webhooks — sync on-chain events with PostgreSQL
    post "/webhooks/milestone-submitted", WebhookController, :milestone_submitted
    post "/webhooks/sync-campaign", SyncController, :sync_campaign
    post "/webhooks/sync-backing", SyncController, :sync_backing
    post "/webhooks/sync-claim-tokens", SyncController, :sync_claim_tokens
    post "/webhooks/sync-vote", SyncController, :sync_vote
    post "/webhooks/sync-refund", SyncController, :sync_refund
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

    # Creator: edit campaign (description, cover, video)
    put "/campaigns/:id/edit", CampaignController, :update_campaign

    # Milestone comments (authenticated write)
    post "/milestones/:milestone_id/comments", CommentController, :create

    # Creator: submit evidence
    post "/campaigns/:campaign_id/milestones/:index/evidence", MilestoneController, :submit_evidence

    # Creator: post update
    post "/campaigns/:campaign_id/updates", UpdateController, :create

    # Upload cover image
    post "/upload/cover", UploadController, :cover

    # AI Helper
    post "/ai/help", AiHelperController, :help

    # AI Companion
    get "/ai/nudges", CompanionController, :nudges
    post "/ai/nudges/:id/dismiss", CompanionController, :dismiss_nudge
    post "/ai/evidence_draft", CompanionController, :evidence_draft
    post "/ai/update_draft", CompanionController, :update_draft
    post "/ai/companion_chat", CompanionController, :companion_chat

    # GitHub OAuth
    get "/auth/github", GithubAuthController, :authorize
    post "/auth/github/callback", GithubAuthController, :callback

    # Governance: check my vote
    get "/milestones/:milestone_id/my-vote", GovernanceController, :my_vote

    # Notifications
    get "/notifications", NotificationController, :index
    post "/notifications/mark-read", NotificationController, :mark_read
  end

  # ═══════════════════════════════════════════
  # ADMIN API
  # ═══════════════════════════════════════════

  scope "/api/admin", QadamBackendWeb do
    pipe_through [:api, :admin]

    get "/dashboard", AdminDashboardController, :index
    get "/review-queue", AdminController, :review_queue
    get "/campaigns", AdminController, :list_campaigns
    get "/campaigns/:id/detail", AdminController, :show_campaign
    get "/milestones", AdminAuditController, :list_milestones
    get "/milestones/:id/detail", AdminAuditController, :show_milestone
    get "/audit", AdminAuditController, :audit_log
    get "/ai/stats", AdminAuditController, :ai_stats
    get "/users", AdminAuditController, :list_users
    get "/users/:wallet", AdminAuditController, :show_user
    get "/governance", AdminAuditController, :governance
    post "/milestones/:id/decide", AdminController, :decide
    post "/campaigns/:id/feature", AdminController, :set_featured
    post "/campaigns/:id/pause", AdminController, :pause_campaign
    post "/campaigns/:id/resume", AdminController, :resume_campaign
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
