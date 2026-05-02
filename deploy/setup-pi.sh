#!/usr/bin/env bash
set -euo pipefail

APP_USER="${1:-pi}"
APP_DIR="${2:-/home/pi/myapp}"
DB_NAME="${DB_NAME:-iot_monitoring}"
DB_USER="${DB_USER:-iot_user}"
DB_PASSWORD="${DB_PASSWORD:-iot_pass123}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
API_PORT="${API_PORT:-3001}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute como root: sudo bash deploy/setup-pi.sh [usuario] [diretorio]" >&2
  exit 1
fi

apt update
apt install -y curl git build-essential postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt install -y nodejs
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Diretório do app não encontrado: $APP_DIR" >&2
  echo "Clone o repositório primeiro ou passe o caminho correto como segundo argumento." >&2
  exit 1
fi

cat <<EOF
Próximos passos:
1. Copie o repositório para $APP_DIR
2. Rode: cd $APP_DIR && npm install
3. Crie o banco PostgreSQL e habilite a configuração em data/system_config.json
4. Instale os serviços em /etc/systemd/system usando os arquivos em deploy/
EOF

echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Banco esperado: $DB_NAME / $DB_USER"
echo "Portas: backend=$BACKEND_PORT api=$API_PORT"

cat > /etc/systemd/system/trabalho-final.service <<EOF2
[Unit]
Description=Trabalho Final IoT - Backend principal
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF2

cat > /etc/systemd/system/api-gateway.service <<EOF2
[Unit]
Description=Trabalho Final IoT - API Gateway
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=PORT=$API_PORT
Environment=BACKEND_URL=http://127.0.0.1:$BACKEND_PORT
ExecStart=/usr/bin/node $APP_DIR/api-server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF2

if [ -f "$APP_DIR/deploy/system_config.pi.json" ]; then
  cp "$APP_DIR/deploy/system_config.pi.json" "$APP_DIR/data/system_config.json"
  chown "$APP_USER":"$APP_USER" "$APP_DIR/data/system_config.json"
fi

systemctl daemon-reload
systemctl enable trabalho-final.service api-gateway.service
systemctl restart trabalho-final.service api-gateway.service || true