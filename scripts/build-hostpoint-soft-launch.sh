#!/usr/bin/env bash
# Baut ein schlankes Upload-Paket für Hostpoint (nur Programm-Soft-Launch).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/deploy/hostpoint-soft-launch"

rm -rf "${OUT}"
mkdir -p "${OUT}/programm" "${OUT}/css" "${OUT}/js" "${OUT}/images"

# Soft-Launch-Startseite: nur Redirect zum Programm
cat > "${OUT}/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Historischer Verein Winterthur</title>
  <link rel="canonical" href="https://www.hvwinterthur.ch/programm">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url=/programm/">
  <script>location.replace('/programm/' + location.search + location.hash);</script>
</head>
<body>
  <p><a href="/programm/">Weiter zum Programm</a></p>
</body>
</html>
HTML

cp "${ROOT}/.htaccess" "${OUT}/.htaccess"
cp "${ROOT}/robots.txt" "${OUT}/robots.txt"
cp "${ROOT}/programm/index.html" "${OUT}/programm/index.html"
cp "${ROOT}/programm/.htaccess" "${OUT}/programm/.htaccess"
cp "${ROOT}/css/site.css" "${OUT}/css/site.css"
cp "${ROOT}/js/tailwind-config.js" "${OUT}/js/tailwind-config.js"
cp "${ROOT}/images/hvw-logo.png" "${OUT}/images/hvw-logo.png"

cat > "${OUT}/UPLOAD.txt" <<'TXT'
Hostpoint Soft-Launch — Upload-Anleitung
========================================

Ziel-URL: https://www.hvwinterthur.ch/programm

1. Im Hostpoint Control Panel den Document Root von www.hvwinterthur.ch öffnen
   (FTP/SFTP oder Dateimanager).
2. Den gesamten Inhalt DIESES Ordners in den Document Root hochladen
   (index.html, .htaccess, robots.txt, programm/, css/, js/, images/).
3. Prüfen: https://www.hvwinterthur.ch/programm
4. Eventfrog: Domain www.hvwinterthur.ch für das Embed freischalten.

Hinweis: Die übrige Prototyp-Website gehört NICHT in diesen Upload.
Bevorzugt: GitHub Action «Deploy via rsync» (siehe README).
TXT

echo "Hostpoint-Paket erstellt: ${OUT}"
find "${OUT}" -type f | sort
