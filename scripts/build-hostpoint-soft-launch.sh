#!/usr/bin/env bash
# Baut ein schlankes Upload-Paket für Hostpoint (nur Programm-Soft-Launch).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/deploy/hostpoint-soft-launch"

rm -rf "${OUT}"
mkdir -p "${OUT}/programm" "${OUT}/css" "${OUT}/js" "${OUT}/images" "${OUT}/data"

# Stamm-URL: Weiterleitung zur bestehenden Vereinswebsite (nicht zum Programm)
cat > "${OUT}/index.html" <<'HTML'
<!DOCTYPE html>
<html lang="de-CH">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Historischer Verein Winterthur</title>
  <link rel="canonical" href="https://www.historischer-verein-winterthur.ch/">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url=https://www.historischer-verein-winterthur.ch/">
  <script>location.replace('https://www.historischer-verein-winterthur.ch/' + location.search + location.hash);</script>
</head>
<body>
  <p><a href="https://www.historischer-verein-winterthur.ch/">Weiter zur Website des Historischen Vereins Winterthur</a></p>
</body>
</html>
HTML

cp "${ROOT}/.htaccess" "${OUT}/.htaccess"
cp "${ROOT}/robots.txt" "${OUT}/robots.txt"
cp "${ROOT}/programm/index.html" "${OUT}/programm/index.html"
cp "${ROOT}/programm/.htaccess" "${OUT}/programm/.htaccess"
if [[ -f "${ROOT}/programm/HalbJahresprogramm.pdf" ]]; then
  cp "${ROOT}/programm/HalbJahresprogramm.pdf" "${OUT}/programm/HalbJahresprogramm.pdf"
fi
if [[ -f "${ROOT}/programm/HalbJahresprogramm.json" ]]; then
  cp "${ROOT}/programm/HalbJahresprogramm.json" "${OUT}/programm/HalbJahresprogramm.json"
fi
cp "${ROOT}/css/site.css" "${OUT}/css/site.css"
cp "${ROOT}/js/tailwind-config.js" "${OUT}/js/tailwind-config.js"
cp "${ROOT}/js/analytics.js" "${OUT}/js/analytics.js"
cp "${ROOT}/data/analytics.json" "${OUT}/data/analytics.json"
cp "${ROOT}/images/hvw-logo.png" "${OUT}/images/hvw-logo.png"

cat > "${OUT}/UPLOAD.txt" <<'TXT'
Hostpoint Soft-Launch — Upload-Anleitung
========================================

Stamm-URL:  https://www.hvwinterthur.ch/  →  https://www.historischer-verein-winterthur.ch/
Programm:   https://www.hvwinterthur.ch/programm  (Newsletter / Direktlink)

1. Im Hostpoint Control Panel den Document Root von www.hvwinterthur.ch öffnen
   (FTP/SFTP oder Dateimanager).
2. Den gesamten Inhalt DIESES Ordners in den Document Root hochladen
   (index.html, .htaccess, robots.txt, programm/, css/, js/, data/, images/).
3. Prüfen:
   - https://www.hvwinterthur.ch/         → Weiterleitung zur Vereinswebsite
   - https://www.hvwinterthur.ch/programm → Programmseite
4. Eventfrog: Domain www.hvwinterthur.ch für das Embed freischalten.

Hinweis: Die übrige Prototyp-Website gehört NICHT in diesen Upload.
Bevorzugt: GitHub Action «Deploy via rsync» (siehe README).
TXT

echo "Hostpoint-Paket erstellt: ${OUT}"
find "${OUT}" -type f | sort
