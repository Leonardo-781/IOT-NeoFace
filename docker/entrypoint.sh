#!/bin/sh
set -eu

if [ "${GENERATE_SYSTEM_CONFIG:-0}" = "1" ]; then
  mkdir -p /app/data
  cat > /app/data/system_config.json <<EOF
{
  "database": {
    "enabled": true,
    "engine": "timescaledb",
    "host": "${DB_HOST:-db}",
    "port": ${DB_PORT:-5432},
    "database": "${DB_NAME:-iot_monitoring}",
    "username": "${DB_USER:-iot_user}",
    "password": "${DB_PASSWORD:-iot_pass123}",
    "ssl": ${DB_SSL:-false},
    "retentionDays": ${DB_RETENTION_DAYS:-30}
  }
}
EOF
fi

exec "$@"