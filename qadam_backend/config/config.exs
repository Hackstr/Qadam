# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :qadam_backend,
  ecto_repos: [QadamBackend.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configures the endpoint
config :qadam_backend, QadamBackendWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: QadamBackendWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: QadamBackend.PubSub,
  live_view: [signing_salt: "PK0GHM+X"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :qadam_backend, QadamBackend.Mailer, adapter: Swoosh.Adapters.Local

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Oban job queue
config :qadam_backend, Oban,
  repo: QadamBackend.Repo,
  queues: [
    ai_verification: 2,
    solana_tx: 3,
    notifications: 5,
    deadline_monitor: 1
  ],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    {Oban.Plugins.Cron,
     crontab: [
       # Check overdue milestones every 5 minutes
       {"*/5 * * * *", QadamBackend.Workers.DeadlineMonitorWorker}
     ]}
  ]

# Joken JWT config
config :joken,
  default_signer: [
    signer_alg: "HS256",
    key_octet: "change_me_in_prod_use_runtime_exs"
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
