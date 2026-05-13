#!/usr/bin/env bash
set -u

ROOT_DIR="$(pwd)"
CFG_PATH="$ROOT_DIR/data/system_config.json"

echo "Run-from: $ROOT_DIR"

if [ ! -f "$CFG_PATH" ]; then
  echo "data/system_config.json not found in current directory." >&2
  echo "Attempting to locate file under /home/leo..." >&2
  FOUND=$(find /home/leo -type f -name system_config.json 2>/dev/null | head -n 1 || true)
  if [ -n "$FOUND" ]; then
    echo "Found: $FOUND" >&2
    echo "Please cd to the app root (the parent of 'data') and re-run this script." >&2
  else
    echo "Could not locate system_config.json automatically. Please run this script from the application's root directory." >&2
  fi
  exit 1
fi

echo "Backing up $CFG_PATH -> ${CFG_PATH}.bak"
cp "$CFG_PATH" "${CFG_PATH}.bak"

echo "Updating database config in $CFG_PATH"
node -e "const fs=require('fs');const p=process.argv[1];try{const j=JSON.parse(fs.readFileSync(p,'utf8'));j.database=j.database||{};j.database.host='192.168.1.16';j.database.port=5432;j.database.database='iot_monitoring';j.database.username='iot_user';j.database.password='iot_pass123';j.database.ssl=false;fs.writeFileSync(p,JSON.stringify(j,null,2));console.log('OK system_config atualizado')}catch(e){console.error('ERRO',e.message);process.exit(2)}" "$CFG_PATH"

echo "Installing node modules (this may take a few minutes)"
if [ -f package.json ]; then
  npm ci || npm install
else
  echo "package.json not found in $ROOT_DIR" >&2
  exit 3
fi

echo "Ensuring pm2 is available (will install globally if needed)"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 || { echo "Failed to install pm2. Install it manually and re-run." >&2; exit 4; }
fi

echo "Starting processes with pm2 using deploy/ecosystem.config.js"
if [ -f deploy/ecosystem.config.js ]; then
  pm2 start deploy/ecosystem.config.js --env production
else
  pm2 start server.js --name tf-server --watch --env production --  
  pm2 start api-server.js --name tf-api --watch --env production --
fi

pm2 save

PUBLIC_URL=""
if command -v tailscale >/dev/null 2>&1; then
  echo "Configuring Tailscale Serve/Funnel for public access"
  sudo tailscale serve reset >/dev/null 2>&1 || true
  sudo tailscale funnel reset >/dev/null 2>&1 || true
  sudo tailscale serve --bg http://127.0.0.1:3000 >/dev/null 2>&1 || true
  sudo tailscale funnel --bg http://127.0.0.1:3000 >/dev/null 2>&1 || true
  PUBLIC_URL=$(tailscale status 2>/dev/null | sed -n 's/^# Funnel on:[[:space:]]*//p' | head -n 1)
fi

echo "Configuring pm2 to start on boot"
STARTUP_CMD=$(pm2 startup -u $(whoami) --silent 2>/dev/null || true)
if [ -n "$STARTUP_CMD" ]; then
  echo "pm2 startup output:"; echo "$STARTUP_CMD"
  echo "If the above printed a command, run it with sudo to enable startup. Example:" 
  echo "  sudo ${STARTUP_CMD}"
fi

echo "Done. Check process status with: pm2 status"
echo "View logs: pm2 logs tf-server --lines 200" 
if [ -n "$PUBLIC_URL" ]; then
  echo "Public URL: $PUBLIC_URL"
else
  echo "Public URL: use 'tailscale status' to confirm the Funnel URL"
fi

exit 0
