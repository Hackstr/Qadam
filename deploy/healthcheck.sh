#!/bin/bash
# Qadam healthcheck — restarts failed services
# Runs every 5 minutes via cron

LOG="/home/ubuntu/logs/healthcheck.log"
mkdir -p "$(dirname "$LOG")"

check_service() {
    local name="$1"
    local url="$2"

    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
        return 0
    else
        echo "[$(date)] $name is DOWN — restarting..." >> "$LOG"
        sudo systemctl restart "$name"
        sleep 5
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            echo "[$(date)] $name recovered after restart" >> "$LOG"
        else
            echo "[$(date)] $name STILL DOWN after restart — manual intervention needed" >> "$LOG"
        fi
        return 1
    fi
}

check_service "qadam-frontend" "http://127.0.0.1:3000"
check_service "qadam-backend" "http://127.0.0.1:4000/api/health"
