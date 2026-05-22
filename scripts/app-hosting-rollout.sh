#!/usr/bin/env bash
# Después de crear el backend en App Hosting (consola o CLI), lanza un deploy desde main.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKEND="${1:-}"
if [[ -z "$BACKEND" ]]; then
  echo "Uso: ./scripts/app-hosting-rollout.sh BACKEND_ID"
  echo ""
  echo "Listar backends:"
  firebase apphosting:backends:list --project wodsi-47ffb
  exit 1
fi

firebase apphosting:rollouts:create "$BACKEND" \
  --project wodsi-47ffb \
  --git-branch main \
  --force

echo "Rollout iniciado. URL en: firebase apphosting:backends:get $BACKEND --project wodsi-47ffb"
