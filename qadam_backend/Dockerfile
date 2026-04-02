# Qadam Backend — Multi-stage Dockerfile for Fly.io
# Build: docker build -t qadam-backend .
# Run: docker run -p 4000:4000 qadam-backend

# --- Build Stage ---
FROM hexpm/elixir:1.18.4-erlang-28.0.2-debian-bookworm-20250317 AS build

RUN apt-get update -y && apt-get install -y build-essential git nodejs npm && apt-get clean

WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV=prod

# Install dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

# Copy application code
COPY config config
COPY lib lib
COPY priv priv

# Compile and build release
RUN mix compile
RUN mix release

# --- Runtime Stage ---
FROM debian:bookworm-slim AS runtime

RUN apt-get update -y && apt-get install -y libstdc++6 openssl libncurses5 locales ca-certificates nodejs npm \
  && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Set locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR /app

# Copy release from build stage
COPY --from=build /app/_build/prod/rel/qadam_backend ./
COPY --from=build /app/priv/solana ./priv/solana

# Install Node.js deps for signing script
RUN cd priv/solana && npm init -y && npm install @solana/web3.js 2>/dev/null || true

ENV PHX_SERVER=true
ENV PORT=4000

EXPOSE 4000

CMD ["bin/qadam_backend", "start"]
