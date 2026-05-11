#!/bin/bash
set -euo pipefail

# Qadam deploy script
# Usage: ./deploy.sh           (deploy everything)
#        ./deploy.sh frontend   (frontend only)
#        ./deploy.sh backend    (backend only)

REPO_DIR="/home/ubuntu/qadam"
ENV_FILE="$REPO_DIR/.env.production"
COMPONENT="${1:-all}"

export PATH="$HOME/.asdf/shims:$HOME/.asdf/bin:$PATH"

echo "=== Qadam Deploy — $(date) ==="

# Pull latest code
cd "$REPO_DIR"
echo "[1/4] Pulling latest code..."
git pull origin main

# Source env for build steps
set -a
source "$ENV_FILE"
set +a

deploy_frontend() {
    echo "[2/4] Building frontend..."
    cd "$REPO_DIR/qadam_frontend"
    npm install --prefer-offline 2>/dev/null
    NODE_ENV=production npx next build

    echo "[3/4] Restarting frontend..."
    sudo systemctl restart qadam-frontend
    sleep 2

    if sudo systemctl is-active --quiet qadam-frontend; then
        echo "  Frontend: OK"
    else
        echo "  Frontend: FAILED — check: journalctl -u qadam-frontend -n 50"
        return 1
    fi
}

deploy_backend() {
    echo "[2/4] Compiling backend..."
    cd "$REPO_DIR/qadam_backend"
    MIX_ENV=prod mix deps.get --only prod
    MIX_ENV=prod mix compile
    MIX_ENV=prod mix ecto.migrate

    echo "[3/4] Restarting backend..."
    sudo systemctl restart qadam-backend
    sleep 5

    if sudo systemctl is-active --quiet qadam-backend; then
        echo "  Backend: OK"
    else
        echo "  Backend: FAILED — check: journalctl -u qadam-backend -n 50"
        return 1
    fi
}

case "$COMPONENT" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac

# Healthcheck
echo "[4/4] Healthcheck..."
sleep 2
if curl -sf http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "  Frontend (port 3000): OK"
else
    echo "  Frontend (port 3000): NOT RESPONDING"
fi

if curl -sf http://127.0.0.1:4000/api/health > /dev/null 2>&1; then
    echo "  Backend  (port 4000): OK"
else
    echo "  Backend  (port 4000): NOT RESPONDING"
fi

echo "=== Deploy complete — $(date) ==="
