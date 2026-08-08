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

## Soft-Launch: Programm-Seite

Solange die Gesamtwebsite noch nicht live geht, ist die Newsletter-fähige
Programmseite unter **`/programm`** verfügbar:

- Seite: `programm/index.html` (nur Eventfrog-«Programm», ohne Rückblick/Navigation)
- Canonical / Ziel-URL: `https://www.hvwinterthur.ch/programm`
- `robots.txt` + `noindex` auf Prototyp-Seiten: nur `/programm` soll öffentlich indexiert werden
- Bis zum Soft-Launch bleibt die Seite auch unter GitHub Pages erreichbar:
  `https://seidenraupe.github.io/prototype-hvw-website/programm/`

### Domain `www.hvwinterthur.ch` verbinden (einmalig)

1. DNS: `www` als **CNAME** auf `seidenraupe.github.io`
2. Optional Apex `hvwinterthur.ch` per Redirect/ALIAS auf `www`
3. GitHub → Repo → Settings → Pages → Custom domain: `www.hvwinterthur.ch` (HTTPS erzwingen)
4. Root-Datei `CNAME` mit Inhalt `www.hvwinterthur.ch` im Repo anlegen (oder von Pages-UI erzeugen lassen)

### Eventfrog

Die Domain `www.hvwinterthur.ch` (und ggf. die GitHub-Pages-URL) muss im
Eventfrog-Cockpit für das Embed freigeschaltet sein — sonst bleibt das Widget leer.

### Newsletter-Link

```
https://www.hvwinterthur.ch/programm
```

### Später: volle Website live

Wenn die restlichen Seiten live gehen: `noindex` in den HTML-Seiten wieder auf
`index,follow` setzen und `robots.txt` öffnen.

## Struktur

```
programm/           Soft-Launch Programmseite (Newsletter-URL)
programm.html       Redirect → /programm/
robots.txt          Soft-Launch Indexierung
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
scripts/            Eventfrog-Fetch
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
