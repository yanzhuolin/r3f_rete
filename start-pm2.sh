#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is not installed. Installing globally..."
  npm install -g pm2
fi

if pm2 describe roll-order-app >/dev/null 2>&1; then
  pm2 delete roll-order-app
fi
pm2 start ./node_modules/next/dist/bin/next --name roll-order-app -- start --port 3456

pm2 save
echo "[roll-order] App is running at http://localhost:3456"
