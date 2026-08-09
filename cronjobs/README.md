# Cronjobs für hvwinterthur.ch (Hostpoint)

Migriert von Kreativ Media (`giger-straehl.ch` / Plesk).

## Was läuft täglich?

| Job | Skript | Ergebnis |
|---|---|---|
| Coucou-Export | `eventfrog_to_coucou.py` | `https://www.hvwinterthur.ch/coucou_export.json` |
| Homepage-Events | *(nicht hier)* | GitHub Action `update-eventfrog-events.yml` → `data/home-events.json` |

Das frühere `fetch-events.mjs` aus dem Plesk-Ordner ist durch die GitHub Action ersetzt und wird **nicht** auf Hostpoint eingerichtet.

## Hostpoint-Einrichtung

### 1. Dateien hochladen

Zielordner (ausserhalb des öffentlichen Webroots):

```text
/home/zozuhosa/cronjobs/
```

Inhalt:

- `eventfrog_to_coucou.py`
- `requirements.txt`
- `eventfrog_api_key` (lokal aus `.example` erzeugen, **nicht** committen)

Oder GitHub Action **Deploy cronjobs to Hostpoint** manuell starten
(`.github/workflows/deploy-cronjobs.yml`) — legt Skripte + Key aus dem
Secret `EVENTFROG_API_KEY` ab.

### 2. Python-Abhängigkeit (einmalig per SSH)

```bash
cd ~/cronjobs
/usr/local/bin/python -m pip install --user -r requirements.txt
```

### 3. Cronjob im Control Panel

Hostpoint → Server-Übersicht → **Advanced** → **Cronjobs Manager**

| Feld | Wert |
|---|---|
| Minute | `0` |
| Hour | `3` |
| Day / Month / Weekday | `*` |

Befehl:

```bash
cd /home/zozuhosa/cronjobs && HVW_WRITE_HOME_EVENTS=0 /usr/local/bin/python eventfrog_to_coucou.py >/dev/null 2>&1
```

Optional mit explizitem Webroot:

```bash
cd /home/zozuhosa/cronjobs && HVW_HTTPDOCS_DIR=/home/zozuhosa/www/hvwinterthur.ch HVW_WRITE_HOME_EVENTS=0 /usr/local/bin/python eventfrog_to_coucou.py >/dev/null 2>&1
```

### 4. Coucou umstellen

In der Coucou-Schnittstelle die JSON-URL auf Hostpoint setzen:

```text
https://www.hvwinterthur.ch/coucou_export.json
```

Danach den alten Cron auf Kreativ Media deaktivieren.

### 5. Prüfen

```bash
cd ~/cronjobs && HVW_WRITE_HOME_EVENTS=0 /usr/local/bin/python eventfrog_to_coucou.py
curl -sI https://www.hvwinterthur.ch/coucou_export.json
```

## Hinweis

Der Coucou-Export läuft **nur** über den Hostpoint-Cronjobs Manager, nicht
über GitHub Actions. Soft-Launch-Deploy (`Deploy via rsync`) löscht
`coucou_export.json` nicht (`rsync --exclude`).

Skript-Änderungen im Repo werden mit der Action
`deploy-cronjobs.yml` nach `~/cronjobs/` synchronisiert (bei Push auf `main`
unter `cronjobs/` oder manuell per `workflow_dispatch`).

## Secrets

| Secret | Verwendung |
|---|---|
| `EVENTFROG_API_KEY` | Eventfrog Public API (für Deploy der Key-Datei auf Hostpoint) |
| `SSH_*` | Deploy der Cron-Skripte nach Hostpoint (wie Soft-Launch) |
