# Historischer Verein Winterthur — Website-Prototyp

Moderne HTML/CSS-Website aus den vorhandenen Wireframes/Mood-Referenzen, mit **Tailwind CSS Event-Karten** (Mobile First).

## Design-Richtung

- Visuell verwandt mit [museumschaffen.ch](https://www.museumschaffen.ch/) (gleicher Trägerverein)
- Klarere UX: grosse Touch-Ziele (min. 48px), hohe Kontraste, ruhige Navigation
- Typografie: Outfit (geometrisch, gut lesbar — nicht Inter)
- Schwarz/Weiss wie Museum Schaffen, mit klaren CTAs

## Event-Karten (Tailwind)

Raster **Mobile First**:

| Breakpoint | Spalten | Tailwind |
|---|---|---|
| Smartphone | 1 | `grid-cols-1` |
| Tablet (`md`) | 2 | `md:grid-cols-2` |
| Desktop (`lg`) | 3 | `lg:grid-cols-3` |

Platzhalterbilder tragen den Wasserzeichen-Vermerk **«finales Bild fehlt»**.

Datenquelle: `data/home-events.json` (Eventfrog Public API via `scripts/fetch-eventfrog-events.mjs` / GitHub Action).

## SEO & GEO

- `lang="de-CH"`, Canonical, Open Graph
- Geo-Meta (`geo.region`, `geo.placename`, Position Winterthur)
- JSON-LD: `NonprofitOrganization`, `WebSite`, `Event`, `FAQPage`, `Museum`
- `sameAs` zu museumschaffen.ch
- Semantische Event-Karten (`itemscope` Event / Place / `time`)

## Lokal ansehen

```bash
python3 -m http.server 8080
# → http://localhost:8080
# Soft-Launch Programm: http://localhost:8080/programm/
```

## Soft-Launch: Programm auf Hostpoint

Produktive Zielumgebung ist **Hostpoint** (`www.hvwinterthur.ch`), nicht GitHub Pages.
GitHub bleibt nur Prototyp-/Quellrepo.

Solange die Gesamtwebsite noch nicht live geht:

- Stamm-URL `https://www.hvwinterthur.ch/` → Weiterleitung nach
  **`https://www.historischer-verein-winterthur.ch/`** (wie bisher)
- Direktlink / Newsletter: **`https://www.hvwinterthur.ch/programm`**
- Inhalt Programm: nur Eventfrog-«Programm» (ohne Rückblick / Prototyp-Navigation)
- Apache/Hostpoint: `.htaccess` (Stamm-Redirect + `/programm`)
- `robots.txt` + `noindex` auf Prototyp-Seiten

### Deploy auf Hostpoint (GitHub Actions)

Workflow: `.github/workflows/deploy.yml` — bei Push auf `main` (oder manuell unter Actions).

Baut `deploy/hostpoint-soft-launch/` und synct **nur dieses Paket** per rsync/SSH
in den Document Root.

#### Secrets (Repo → Settings → Secrets and variables → Actions)

| Secret | Inhalt |
|---|---|
| `SSH_PRIVATE_KEY` | Kompletter **privater** Key inkl. `-----BEGIN … PRIVATE KEY-----` / `END` (nicht `.pub`) |
| `SSH_HOST` | Server-Hostname aus Hostpoint «Server Übersicht», z. B. `sl45.web.hostpoint.ch` |
| `SSH_USER` | Hosting-Account exakt wie im Control Panel, z. B. `zozuhosa` |
| `SSH_TARGET_DIR` | Document Root mit `/` am Ende, z. B. `/home/zozuhosa/www/hvwinterthur.ch/` |

#### SSH bei Hostpoint vorbereiten

1. Im Control Panel SSH aktivieren (falls nötig)
2. Key-Paar erzeugen (ohne Passphrase): `ssh-keygen -t ed25519 -C "github-deploy-hvw" -f hvw_deploy -N ""`
3. Inhalt von `hvw_deploy.pub` bei Hostpoint als authorized key hinterlegen
4. Inhalt von `hvw_deploy` als Secret `SSH_PRIVATE_KEY` speichern

Der letzte Workflow-Fehler war: Hostname nicht auflösbar + Private Key nur ~11 Zeichen
(Secret `SSH_HOST` / `SSH_PRIVATE_KEY` falsch gesetzt).

#### Manueller Upload (Fallback)

```bash
./scripts/build-hostpoint-soft-launch.sh
# → deploy/hostpoint-soft-launch/
```

Inhalt per FTP/SFTP oder Hostpoint-Dateimanager in den Document Root hochladen.

### Eventfrog

Domain `www.hvwinterthur.ch` im Eventfrog-Cockpit für das Embed freischalten —
sonst bleibt das Widget leer.

### Cronjobs / Coucou-Export (Hostpoint)

Der frühere Plesk-Cron auf `giger-straehl.ch`
(`eventfrog_to_coucou.py` → Event-File für Coucou) ist nach Hostpoint migriert:

- Skripte: `cronjobs/` (siehe `cronjobs/README.md`)
- Öffentliche Dateien:
  - `https://www.hvwinterthur.ch/coucou_export.json` (Coucou, alle Org-IDs)
  - `https://www.hvwinterthur.ch/mus_export.json` (Museum Schaffen, OrgID 5116588)
- Täglich nur auf Hostpoint (Cronjobs Manager), nicht über GitHub Actions
- Soft-Launch-Deploy löscht die Export-JSONs nicht (`rsync --exclude`)
- Skript-Updates nach Hostpoint: Action `deploy-cronjobs.yml` (bei Änderungen an `cronjobs/`)

Homepage-Events (`data/home-events.json`) laufen weiter über
`update-eventfrog-events.yml` — nicht über den Hostpoint-Cron.

### Newsletter-Link

```
https://www.hvwinterthur.ch/programm
```

### Halbjahresprogramm (PDF)

Auf der Soft-Launch-Programmseite gibt es einen Download des aktuellen
Halbjahresprogramms (A4, druckbar, mit Logo, Kalenderblatt und Event-Bildern):

```
https://www.hvwinterthur.ch/programm/HalbJahresprogramm.pdf
```

Erzeugung aus Eventfrog (alle drei Org-IDs):

```bash
pip install -r scripts/requirements-pdf.txt
EVENTFROG_API_KEY=… python3 scripts/generate-halbjahresprogramm-pdf.py
```

Beim Soft-Launch-Deploy wird das PDF in GitHub Actions frisch erzeugt.
Die Integration auf der finalen `agenda.html` folgt nach Freigabe der Soft-Launch-Version.

### Google Analytics 4 (Soft-Launch)

Die Programmseite kann mit **GA4** im Konto `thomas.giger@cloud-7.net` gemessen werden
(gleiche Analytics-Oberfläche wie bei Ihren anderen Websites).

Aktuelle Soft-Launch Measurement ID: **`G-14VQXM5EK7`**

Auf `/programm` ist der Google-Tag **inline** im `<head>` (wie von Google
vorgesehen), damit die Tag-Erkennung greift. Zusätzlich bleibt
`data/analytics.json` / `js/analytics.js` für weitere Seiten.

1. Mit diesem Konto auf [analytics.google.com](https://analytics.google.com) anmelden
2. **Admin** → Property / Datenstream für `https://www.hvwinterthur.ch`
3. **Measurement ID** in `programm/index.html` (Inline-Tag) und
   `data/analytics.json` eintragen, Soft-Launch neu deployen
4. In GA4 unter **Realtime** prüfen bzw. Tag-Setup erneut testen

### Später: volle Website live

`noindex` wieder auf `index,follow` setzen, `robots.txt` öffnen und den
kompletten Site-Build (nicht nur Soft-Launch) nach Hostpoint deployen.

## Struktur

```
programm/           Soft-Launch Programmseite (Hostpoint-URL /programm)
programm.html       Redirect → /programm/
.htaccess           Apache/Hostpoint (HTTPS, Clean URLs)
robots.txt          Soft-Launch Indexierung
scripts/build-hostpoint-soft-launch.sh
deploy/hostpoint-soft-launch/   (generiertes Upload-Paket)
cronjobs/           Coucou- + Museum-Schaffen-Export für Hostpoint (täglich)
index.html          Startseite mit Event-Karten (Prototyp)
agenda.html         Agenda (Programm + Rückblick)
museen.html         Museum Schaffen / Lindengut / Mörsburg
publikationen.html  Neujahrsblatt & Schriften
sammlung.html       Ausgewählte Objekte
zitate.html         Stimmen aus Winterthur
ueber-uns.html      Verein + FAQ (GEO)
mitmachen.html      Mitgliedschaft
css/site.css        Motion & Placeholder-Styles
js/main.js          Event-Karten-Rendering
js/tailwind-config.js
data/home-events.json
images/             Logo, Foto, SVG-Platzhalter
reference/wireframes/  Mood-Referenzen aus dem Upload
scripts/            Eventfrog-Fetch / Hostpoint-Build
```

## Eventfrog aktualisieren

```bash
# Public API key erforderlich (GitHub Secret EVENTFROG_API_KEY bzw. lokal gesetzt)
EVENTFROG_API_KEY=<key> node scripts/fetch-eventfrog-events.mjs
# oder:
npm run fetch:events
```

GitHub Action: `.github/workflows/update-eventfrog-events.yml`  
Secret `EVENTFROG_API_KEY` ist **pflichtig**. Im Eventfrog-Cockpit einen **Public API**-Key
anlegen und unter Repo → Settings → Secrets speichern.

Der API-Key liegt nicht im Repository-Code. Die Agenda-Seite (`agenda.html`) nutzt
zusätzlich das öffentliche Eventfrog-Widget (iframe + `embed.js`); dessen Widget-Key in der URL
ist kein API-Secret und muss im HTML stehen.

Fehlende Event-Bilder ergänzt das Fetch-Skript über die `og:image` der Eventfrog-Eventseite.

## Webling-Anmeldung (Mitmachen)

Die Seite `mitmachen.html` bettet das Webling-Mitgliedschaftsformular als **iframe** ein
(Anker `#anmeldeformular`) — technisch wie im vorherigen Prototyp
([prototyp-hvw](https://seidenraupe.github.io/prototyp-hvw/mitmachen.html#anmeldeformular)).

- iframe-`src`: `https://hvwinterthur.webling.ch/forms/memberform/d9e980cf304ee928a7e5`
- Referenz auch in `data/webling-form.json`
- Nach dem Absenden bleibt die Besucherin/der Besucher auf der HVW-Website

## Ausbildung Vorstand (Webling & Eventfrog)

Schritt-für-Schritt-Unterlage inkl. Checklisten und OrgID-Ausspielung:

- [`docs/Ausbildung-Webling-Eventfrog.md`](docs/Ausbildung-Webling-Eventfrog.md)
  — Mitglieder-Mails in Webling und Erfassen/Mutieren von Veranstaltungen in Eventfrog