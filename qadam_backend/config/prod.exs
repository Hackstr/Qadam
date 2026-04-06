import Config

# Configures Swoosh API Client
config :swoosh, api_client: Swoosh.ApiClient.Req

# Disable Swoosh Local Memory Storage
config :swoosh, local: false

# CORS — restrict in production (set CORS_ORIGIN env var)
config :qadam_backend, cors_origin: System.get_env("CORS_ORIGIN") || "https://qadam.xyz"

# Do not print debug messages in production
config :logger, level: :info

# Runtime production configuration, including reading
# of environment variables, is done on config/runtime.exs.
