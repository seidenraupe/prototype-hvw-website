# Cronjobs für hvwinterthur.ch (Hostpoint)

Migriert von Kreativ Media (`giger-straehl.ch` / Plesk).

## Was läuft täglich?

| Job | Skript | Ergebnis |
|---|---|---|
| Coucou-Export | `eventfrog_to_coucou.py` | `https://www.hvwinterthur.ch/coucou_export.json` (alle Org-IDs) |
| Museum Schaffen | `eventfrog_to_mus.py` | `https://www.hvwinterthur.ch/mus_export.json` (nur OrgID `5116588`) |
| Homepage-Events | *(nicht hier)* | GitHub Action `update-eventfrog-events.yml` → `data/home-events.json` |

Beide JSON-Exports nutzen **dasselbe Coucou-Record-Layout**, inkl. Kurz- und
Langbeschreibung (`description`, `description_long`, `description_html`).
`mus_export.json` holt die Agentur von museumschaffen.ch von hvwinterthur.ch ab.

Das frühere `fetch-events.mjs` aus dem Plesk-Ordner ist durch die GitHub Action ersetzt und wird **nicht** auf Hostpoint eingerichtet.

## Hostpoint-Einrichtung

### 1. Dateien hochladen

Zielordner (ausserhalb des öffentlichen Webroots):

```text
/home/zozuhosa/cronjobs/
```

Inhalt:

- `eventfrog_to_coucou.py`
- `eventfrog_to_mus.py`
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

### 3. Cronjobs im Control Panel

Hostpoint → Server-Übersicht → **Advanced** → **Cronjobs Manager**

#### Coucou (alle Organisationen)

| Feld | Wert |
|---|---|
| Minute | `0` |
| Hour | `3` |
| Day / Month / Weekday | `*` |

Befehl:

```bash
cd /home/zozuhosa/cronjobs && HVW_WRITE_HOME_EVENTS=0 /usr/local/bin/python eventfrog_to_coucou.py >/dev/null 2>&1
```

#### Museum Schaffen (`mus_export.json`)

| Feld | Wert |
|---|---|
| Minute | `5` |
| Hour | `3` |
| Day / Month / Weekday | `*` |

Befehl:

```bash
cd /home/zozuhosa/cronjobs && /usr/local/bin/python eventfrog_to_mus.py >/dev/null 2>&1
```

### 4. Abnehmer-URLs

| Abnehmer | URL |
|---|---|
| Coucou | `https://www.hvwinterthur.ch/coucou_export.json` |
| museumschaffen.ch (Agentur) | `https://www.hvwinterthur.ch/mus_export.json` |

Alten Cron auf Kreativ Media deaktivieren, sobald Coucou umgestellt ist.

### 5. Prüfen

```bash
cd ~/cronjobs
HVW_WRITE_HOME_EVENTS=0 /usr/local/bin/python eventfrog_to_coucou.py
/usr/local/bin/python eventfrog_to_mus.py
curl -sI https://www.hvwinterthur.ch/coucou_export.json
curl -sI https://www.hvwinterthur.ch/mus_export.json
```

## Hinweis

Die Exporte laufen **nur** über den Hostpoint-Cronjobs Manager, nicht über
GitHub Actions. Soft-Launch-Deploy (`Deploy via rsync`) löscht
`coucou_export.json` und `mus_export.json` nicht (`rsync --exclude`).

Skript-Änderungen im Repo werden mit der Action
`deploy-cronjobs.yml` nach `~/cronjobs/` synchronisiert (bei Push auf `main`
unter `cronjobs/` oder manuell per `workflow_dispatch`).

## Secrets

| Secret | Verwendung |
|---|---|
| `EVENTFROG_API_KEY` | Eventfrog Public API (für Deploy der Key-Datei auf Hostpoint) |
| `SSH_*` | Deploy der Cron-Skripte nach Hostpoint (wie Soft-Launch) |
