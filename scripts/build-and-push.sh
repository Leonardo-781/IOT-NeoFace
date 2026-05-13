#!/usr/bin/env bash
set -euo pipefail

# Usage: IMAGE=registry.example.com/myrepo/myapp TAG=v1.2 ./scripts/build-and-push.sh

IMAGE=${IMAGE:-}
TAG=${TAG:-latest}

if [ -z "$IMAGE" ]; then
  echo "ERROR: set IMAGE environment variable (eg. registry/myapp)"
  exit 2
fi

FULL="$IMAGE:$TAG"

echo "Building image $FULL"
docker build -t "$FULL" .

echo "Pushing $FULL"
docker push "$FULL"

echo "Done: $FULL"
