#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Reconstruye friendlyflights:latest desde src.tar.gz y recrea el contenedor.
# Se ejecuta EN el servidor (lo invoca el workflow de GitHub Actions o un
# ./deploy.ps1 local). Espera estar en /opt/friendlyflights/.
# ----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

[[ -f src.tar.gz ]] || { echo "Falta src.tar.gz"; exit 1; }

rm -rf src && mkdir src
tar -xzf src.tar.gz -C src

docker build -t friendlyflights:latest src

# `up -d` recrea el contenedor porque su imagen cambió.
docker compose up -d --remove-orphans app
docker image prune -f >/dev/null

echo "OK friendlyflights actualizado"
