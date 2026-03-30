defmodule QadamBackend.Repo do
  use Ecto.Repo,
    otp_app: :qadam_backend,
    adapter: Ecto.Adapters.Postgres
end
