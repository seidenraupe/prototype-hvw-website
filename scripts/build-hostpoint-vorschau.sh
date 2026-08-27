#!/usr/bin/env bash
# Baut die passwortgeschützte Vorschau der ganzen Website für Hostpoint (/vorschau/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/deploy/hostpoint-vorschau"
AUTH_USER_FILE="${AUTH_USER_FILE:-.htpasswd}"

rm -rf "${OUT}"
mkdir -p "${OUT}"

copy_dir() {
  local src="$1"
  local dest="$2"
  mkdir -p "${dest}"
  cp -a "${src}/." "${dest}/"
}

for page in index.html agenda.html museen.html ueber-uns.html mitmachen.html \
            publikationen.html sammlung.html zitate.html programm.html; do
  cp "${ROOT}/${page}" "${OUT}/${page}"
done

copy_dir "${ROOT}/css" "${OUT}/css"
copy_dir "${ROOT}/js" "${OUT}/js"
copy_dir "${ROOT}/images" "${OUT}/images"
copy_dir "${ROOT}/data" "${OUT}/data"
cp "${ROOT}/data/content-live.json" "${OUT}/data/content-live.seed.json"
copy_dir "${ROOT}/programm" "${OUT}/programm"

mkdir -p "${OUT}/redaktion/storage"
cp "${ROOT}/redaktion/api.php" "${OUT}/redaktion/api.php"
cp "${ROOT}/redaktion/index.php" "${OUT}/redaktion/index.php"
cp "${ROOT}/redaktion/lib.php" "${OUT}/redaktion/lib.php"
cp "${ROOT}/redaktion/.htaccess" "${OUT}/redaktion/.htaccess"
cp "${ROOT}/redaktion/storage/.htaccess" "${OUT}/redaktion/storage/.htaccess"
cp "${ROOT}/redaktion/config.local.example.php" "${OUT}/redaktion/config.local.example.php"

sed "s|__AUTH_USER_FILE__|${AUTH_USER_FILE}|g" \
  "${ROOT}/deploy/vorschau.htaccess" > "${OUT}/.htaccess"
cp "${ROOT}/deploy/vorschau.htpasswd" "${OUT}/.htpasswd"
cp "${ROOT}/deploy/vorschau.robots.txt" "${OUT}/robots.txt"

# Entwürfe und lokale Zugänge gehören nicht ins Paket
rm -f "${OUT}/redaktion/config.local.php"
rm -f "${OUT}/redaktion/storage/content-draft.json"

cat > "${OUT}/UPLOAD.txt" <<'TXT'
Hostpoint interne Vorschau — /vorschau/
======================================

URL:  https://www.hvwinterthur.ch/vorschau/
Login (HTTP):  hvw-vorschau  /  Vorschau-HVW-2026
Danach Redaktion:  https://www.hvwinterthur.ch/vorschau/redaktion/

Die öffentliche Soft-Launch-Seite /programm bleibt unverändert.
Diese Vorschau ist per HTTP-Passwort und robots noindex geschützt.
Redaktionstexte (content-live.json) nicht aus Git überspielen — Merge auf dem Server.

Bevorzugt: GitHub Action «Deploy via rsync» (siehe README).
TXT

echo "Hostpoint-Vorschau erstellt: ${OUT}"
find "${OUT}" -type f | wc -l
