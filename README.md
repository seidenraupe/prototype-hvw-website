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
```

## Struktur

```
index.html          Startseite mit Event-Karten
agenda.html         Agenda (nur Eventfrog-Embed)
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
# Optional: Public API key. Ohne Key (oder bei deaktiviertem Key) nutzt das Skript
# automatisch den öffentlichen Eventfrog-Embed als Fallback.
EVENTFROG_API_KEY=<key> node scripts/fetch-eventfrog-events.mjs
# oder:
node scripts/fetch-eventfrog-events.mjs
```

GitHub Action: `.github/workflows/update-eventfrog-events.yml`  
Secret `EVENTFROG_API_KEY` ist optional. Für die API-Variante im Eventfrog-Cockpit
einen **Public API**-Key anlegen und unter Repo → Settings → Secrets speichern.
