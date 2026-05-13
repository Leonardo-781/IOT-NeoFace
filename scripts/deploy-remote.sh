#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   SERVER=deploy@server-sti DEPLOY_PATH=/opt/tf IMAGE=registry/myrepo/myapp TAG=v1.2 ./scripts/deploy-remote.sh

SERVER=${SERVER:-}
DEPLOY_PATH=${DEPLOY_PATH:-/opt/tf}
IMAGE=${IMAGE:-}
TAG=${TAG:-latest}

if [ -z "$SERVER" ]; then
  echo "ERROR: set SERVER (eg. user@server)"
  exit 2
fi
if [ -z "$IMAGE" ]; then
  echo "ERROR: set IMAGE (eg. registry/myrepo/myapp)"
  exit 2
fi

REMOTE_COMPOSE="$DEPLOY_PATH/docker-compose.yml"

echo "Uploading docker-compose.prod.yml to $SERVER:$REMOTE_COMPOSE"
scp docker-compose.prod.yml "$SERVER:$REMOTE_COMPOSE"

echo "Pulling image on server and bringing up containers"
ssh "$SERVER" "mkdir -p $DEPLOY_PATH && cd $DEPLOY_PATH && IMAGE=$IMAGE TAG=$TAG docker-compose pull && IMAGE=$IMAGE TAG=$TAG docker-compose up -d"

echo "Deployed $IMAGE:$TAG to $SERVER"
