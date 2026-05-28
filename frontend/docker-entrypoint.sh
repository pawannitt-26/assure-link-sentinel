#!/bin/sh
set -e

export PORT="${PORT:-8080}"
export BACKEND_PROXY="${BACKEND_PROXY:-http://backend:8001}"

envsubst '${PORT} ${BACKEND_PROXY}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
