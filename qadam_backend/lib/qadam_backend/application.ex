defmodule QadamBackend.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      QadamBackendWeb.Telemetry,
      QadamBackend.Repo,
      {DNSCluster, query: Application.get_env(:qadam_backend, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: QadamBackend.PubSub},
      # Oban job queue
      {Oban, Application.fetch_env!(:qadam_backend, Oban)},
      # Start to serve requests, typically the last entry
      QadamBackendWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: QadamBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    QadamBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
