# Ausbildungsunterlage: Mitglieder-Mails (Webling) & Veranstaltungen (Eventfrog)

**Historischer Verein Winterthur (HVW)**  
Zielgruppe: Vorstands-Kolleginnen und -Kollegen  
Zweck: Ausbildung und Nachschlagewerk für zwei wiederkehrende Prozesse

| Prozess | Tool | Kurzbeschreibung |
|---|---|---|
| 1 | **Webling** | Motivierendes Mail an alle aktiven Mitglieder zu kommenden Veranstaltungen |
| 2 | **Eventfrog** | Veranstaltungen erfassen und mutieren — inkl. korrekte Veranstalter-Wahl (OrgID) |

---

## Schnellzugriff

| Was | Link / Ort |
|---|---|
| Webling (HVW) | [hvwinterthur.webling.ch](https://hvwinterthur.webling.ch) |
| Eventfrog Cockpit | [eventfrog.ch](https://eventfrog.ch) → Login → Cockpit |
| Agenda / Programm (aktuell Soft-Launch) | [www.hvwinterthur.ch/programm](https://www.hvwinterthur.ch/programm) |
| Agenda (Zielseite Website) | `agenda.html` auf der HVW-Website (nach Go-Live: Agenda-Navigation) |
| Webling-Support: E-Mail senden | [support.webling.ch — E-Mail senden](https://support.webling.ch/hc/de/articles/205148745-E-Mail-senden) |
| Eventfrog-Hilfe: Event erstellen | [eventfrog.ch — Event eintragen](https://eventfrog.ch/de/help/organizer/createevent/process/ticketing.html) |

**Kernregel Eventfrog:** Der gewählte **Veranstalter (OrgID)** entscheidet, auf welchen Websites die Veranstaltung automatisch erscheint. Falsche OrgID = falsche oder fehlende Ausspielung.

---

## Inhaltsverzeichnis

1. [Überblick: Was hängt zusammen?](#1-überblick-was-hängt-zusammen)
2. [Prozess 1 — Mailings in Webling](#2-prozess-1--mailings-in-webling)
3. [Prozess 2 — Veranstaltungen in Eventfrog](#3-prozess-2--veranstaltungen-in-eventfrog)
4. [Veranstalter / OrgIDs (wichtig)](#4-veranstalter--orgids-wichtig)
5. [Checklisten](#5-checklisten)
6. [Häufige Fehler & Tipps](#6-häufige-fehler--tipps)
7. [Mail-Vorlage (Textbaustein)](#7-mail-vorlage-textbaustein)
8. [Glossar](#8-glossar)

---

## 1. Überblick: Was hängt zusammen?

```text
Eventfrog (Erfassung)
        │
        │  Veranstalter = OrgID
        ▼
┌───────────────────┬────────────────────────┬─────────────────────┐
│ HVW-Website       │ museumschaffen.ch      │ Coucou / weitere    │
│ Agenda/Programm   │ (nur OrgID Museum      │ Kanäle              │
│ + Startseite      │  Schaffen)             │                     │
└───────────────────┴────────────────────────┴─────────────────────┘
        │
        │  Inhalt für Mitglieder-Mail
        ▼
     Webling → Mail an aktive Mitglieder
        │
        └── Link auf Agenda/Programm der Website
```

- **Eventfrog** ist die Quelle der Wahrheit für Veranstaltungen (Titel, Datum, Ort, Beschreibung, Tickets).
- Die **Website** übernimmt Events automatisch über die hinterlegten OrgIDs — nichts manuell auf der Agenda nachpflegen.
- **Webling** dient der Mitgliederverwaltung und dem gezielten Mailversand an aktive Mitglieder.

---

## 2. Prozess 1 — Mailings in Webling

### 2.1 Ziel des Mails

Ein **motivierendes** Rundmail an alle **aktiven Vereinsmitglieder** mit:

1. kurzem Überblick über die **kommenden Veranstaltungen**,
2. einer **Detail-Vorstellung der nächsten Veranstaltung** (Highlight),
3. einem klaren CTA-Link auf die **Agenda-/Programm-Seite** der Website.

Empfohlener Link (Stand Soft-Launch):

```text
https://www.hvwinterthur.ch/programm
```

Sobald die volle Website live ist, denselben Hinweis auf die Agenda-Seite setzen (Navigation «Agenda»).

### 2.2 Vorbereitung

1. In Eventfrog bzw. auf der Programmseite prüfen, welche Anlässe als Nächstes anstehen.
2. Für das Highlight (nächste Veranstaltung) notieren:
   - Titel
   - Datum / Uhrzeit
   - Ort
   - 3–6 Sätze: Warum lohnt sich der Besuch? (Thema, Atmosphäre, für wen)
   - Ticket-/Anmeldehinweis (falls relevant)
3. Absender klären (z. B. `info@hvwinterthur.ch` oder vereinbarte Vereinsadresse).
4. Optional: Webling-Vorlage «Mitglieder-Agenda» öffnen bzw. nach dem ersten Versand speichern.

### 2.3 Empfänger: nur aktive Mitglieder

1. Bei Webling anmelden: [hvwinterthur.webling.ch](https://hvwinterthur.webling.ch)
2. Bereich **Mitglieder** öffnen.
3. Die Gruppe **«aktive Mitglieder»** auswählen (nicht die gesamte Mitgliederliste).  
   Ohne diese Gruppenwahl werden auch **Austritte** und andere nicht mehr aktive Einträge mitbedient.
4. Prüfen, dass in der angezeigten Liste nur aktive Mitglieder mit gültiger E-Mail stehen.
5. Alle Einträge dieser Gruppe auswählen bzw. die Gruppe für den Versand markieren.

> **Wichtig:** Nie «alle Mitglieder» oder die ungefilterte Gesamtliste anschreiben. Ohne die Gruppe **«aktive Mitglieder»** landen Mails auch bei ausgetretenen Personen.

### 2.4 E-Mail erstellen und versenden

1. Oberhalb der Liste: **Versenden** → **E-Mail senden**.
2. Design wählen — empfohlen für Programm-Infos: **News** oder **Standard** (mit Button).
3. Optional vorhandene **Vorlage** laden; sonst neu schreiben (siehe [Mail-Vorlage](#7-mail-vorlage-textbaustein)).
4. **Platzhalter** für die Anrede setzen (z. B. Vorname / bedingte Anrede) — wirkt persönlicher.
5. Im Mail:
   - Betreff klar und einladend (Datum oder Highlight im Betreff hilft)
   - Kurz die kommenden Termine listen
   - Die **nächste Veranstaltung ausführlich** vorstellen
   - Prominenter Button/Link: «Zur Agenda» → `https://www.hvwinterthur.ch/programm`
6. **Absender & Empfänger prüfen** («Absender und Empfänger bearbeiten»).
7. Bei mehreren E-Mail-Feldern pro Mitglied: nur die gewünschten Felder anhaken.
8. **Vorschau** anschauen (Platzhalter, Links, Absender).
9. Optional: Testmail an die eigene Adresse.
10. Versenden.
11. Kontrolle unter **Dokumente → E-Mails** (gesendete Mails).

Offizielle Webling-Hilfe: [E-Mail senden](https://support.webling.ch/hc/de/articles/205148745-E-Mail-senden).

### 2.5 Nach dem Versand (empfohlen)

- Vorlage speichern (öffentlich für den Vorstand), falls noch nicht geschehen.
- Kurz im Vorstand notieren: Datum des Versands + Highlight-Anlass (vermeidet Doppelmails).
- Bei Bounce/Retouren: Mitgliedereintrag in Webling nachziehen.

---

## 3. Prozess 2 — Veranstaltungen in Eventfrog

### 3.1 Wann Eventfrog?

Immer wenn ein Anlass öffentlich kommuniziert werden soll:

- Vorträge, Führungen, Vernissagen, Konzerte, Diskussionsrunden, Sonderanlässe
- mit oder ohne Ticketverkauf

Die Website (Agenda/Programm, Startseiten-Karten), Coucou und — je nach Veranstalter — museumschaffen.ch lesen die Daten aus Eventfrog.

### 3.2 Neue Veranstaltung erfassen

1. Bei Eventfrog einloggen und **Cockpit** öffnen.
2. **Event erstellen** wählen.
3. **Art** festlegen:
   - mit Ticketverkauf, oder
   - Agenda-/Kalendereintrag ohne Ticketverkauf.
4. **Veranstaltungsort** wählen (bestehende Location bevorzugen, z. B. Museum Schaffen, Lindengut, Schloss Mörsburg).
5. **Titel, Kurzbeschreibung, Langbeschreibung, Rubrik, Datum/Zeit** ausfüllen.
6. Bild hochladen (ansprechendes, freigegebenes Motiv).
7. Bei Tickets: Kategorien, Preise, Kontingente, Verkaufsfenster.
8. **Veranstalter korrekt wählen** — siehe [Abschnitt 4](#4-veranstalter--orgids-wichtig). Das ist der kritischste Schritt.
9. Angaben speichern / fertigstellen.
10. Im Cockpit **Vorschau** prüfen.
11. **Publizieren** — erst danach erscheint der Anlass öffentlich und in den automatischen Ausspielungen.

Hilfe: [Event mit Ticketverkauf erstellen](https://eventfrog.ch/de/help/organizer/createevent/process/ticketing.html).

### 3.3 Bestehende Veranstaltung mutieren

1. Cockpit → Event suchen / öffnen.
2. **Bearbeiten**.
3. Änderungen an Titel, Text, Zeit, Ort, Bild, Tickets vornehmen.
4. Bei Verschiebung/Absage: Status und Texte klar anpassen (Mitglieder ggf. zusätzlich per Webling informieren).
5. Speichern und prüfen, ob der Event weiterhin **publiziert** ist.
6. Kontrolle auf der Website:
   - Soft-Launch: [hvwinterthur.ch/programm](https://www.hvwinterthur.ch/programm)
   - Startseiten-Karten aktualisieren sich über den Eventfrog-Abruf (nicht immer sofort — bei Bedarf später nochmals prüfen).

### 3.4 Was nach dem Speichern automatisch passiert?

| Kanal | Welche OrgIDs? | Hinweis |
|---|---|---|
| HVW Agenda / Programm (Eventfrog-Widget) | alle drei HVW-OrgIDs | erscheint nach Publikation im Embed |
| HVW Startseiten-Karten | alle drei HVW-OrgIDs | Abruf über API / GitHub Action |
| Coucou-Export | alle drei HVW-OrgIDs | täglicher Hostpoint-Cron |
| museumschaffen.ch (Agentur-Export) | **nur** OrgID Museum Schaffen `5116588` | andere Veranstalter erscheinen dort **nicht** |
| Halbjahresprogramm-PDF | alle drei HVW-OrgIDs | wird beim Soft-Launch-Deploy neu erzeugt |

---

## 4. Veranstalter / OrgIDs (wichtig)

### 4.1 Warum das zählt

Eventfrog kennt für den HVW **mehrere Organisationen (Veranstalter)**. Jede hat eine numerische **OrgID**.  
Unsere Website-Einbindungen und Exporte filtern nach diesen IDs.

**Wer den falschen Veranstalter wählt, steuert die Sichtbarkeit falsch** — z. B.:

- Anlass fehlt auf museumschaffen.ch, obwohl er zum Museum Schaffen gehört, oder
- Anlass erscheint auf museumschaffen.ch, obwohl er nur auf die Vereins-Agenda gehört, oder
- Anlass fehlt ganz auf der HVW-Agenda, weil eine unbekannte/andere Org benutzt wurde.

### 4.2 Übersicht der HVW-OrgIDs

Diese drei OrgIDs sind in der Website und den Exporten hinterlegt:

| OrgID | Veranstalter (Name in Eventfrog) | Typische Anlässe | Ausspielung |
|---|---|---|---|
| **5116588** | **Museum Schaffen** | Programm im / um Museum Schaffen | HVW-Website **und** museumschaffen.ch **und** Coucou |
| **5137433** | **Historischer Verein Winterthur** | z. B. Anlässe Schloss Mörsburg / Verein | HVW-Website **und** Coucou — **nicht** museumschaffen.ch |
| **4936116** | weitere HVW-Organisation im Eventfrog-Konto | je nach Zuordnung im Cockpit | HVW-Website **und** Coucou — **nicht** museumschaffen.ch |

> Die Namen zu `4936116` und ggf. weiteren Konten bitte im Eventfrog-Cockpit unter den Organisationen/Veranstaltern verifizieren und in dieser Tabelle bei Bedarf ergänzen. Die IDs selbst sind in Embed, API und Cronjobs fest verdrahtet.

### 4.3 Entscheidungshilfe: Welchen Veranstalter wählen?

```text
Gehört der Anlass zum öffentlichen Programm von Museum Schaffen
und soll er auch auf museumschaffen.ch erscheinen?
        │
        ├─ JA  → Veranstalter «Museum Schaffen» (OrgID 5116588)
        │
        └─ NEIN → Veranstalter «Historischer Verein Winterthur»
                   bzw. die passende andere HVW-Org im Cockpit
                   (5137433 / 4936116 — gemäss Zuständigkeit)
```

**Faustregeln**

- Museum Schaffen-Programm (Vernissagen, Führungen im Museum, PiMS, Kuratorinnen-Anlässe usw.) → **Museum Schaffen**.
- Vereinsanlässe, Mörsburg, Lindengut (sofern nicht explizit als Museum-Schaffen-Programm geführt) → **Historischer Verein Winterthur** / passende Org — **nicht** Museum Schaffen, sonst landen sie fälschlich im Museums-Export.
- Unsicher? Vor dem Publizieren im Vorstand kurz klären — Nachmutieren ist möglich, aber fehleranfälliger als einmal richtig erfassen.

### 4.4 Mutieren des Veranstalters

Wenn ein Event unter dem falschen Veranstalter läuft:

1. Event im Cockpit öffnen.
2. Veranstalter/Organisation auf die korrekte Org umstellen (soweit Eventfrog das im Bearbeiten-Dialog zulässt).
3. Speichern, Publikationsstatus prüfen.
4. Auf Programmseite und ggf. museumschaffen.ch kontrollieren.
5. Falls die Org nicht umstellbar ist: Event unter der richtigen Org neu anlegen, altes Event depublizieren/löschen, Links aktualisieren.

---

## 5. Checklisten

### 5.1 Checkliste Webling-Mail

- [ ] Kommende Termine aus Eventfrog / Programmseite zusammengestellt
- [ ] Highlight (nächste Veranstaltung) mit Datum, Ort, Motivtext vorbereitet
- [ ] Gruppe **«aktive Mitglieder»** ausgewählt (keine Gesamtliste — sonst auch Austritte)
- [ ] Betreff, Anrede-Platzhalter, motivierender Text
- [ ] Link zur Agenda/Programm: `https://www.hvwinterthur.ch/programm`
- [ ] Absender korrekt
- [ ] Vorschau / Testmail ok
- [ ] Versendet und in Dokumente → E-Mails nachvollziehbar
- [ ] Vorlage aktualisiert/gespeichert

### 5.2 Checkliste Eventfrog neu / mutiert

- [ ] Richtiger **Veranstalter (OrgID)** gewählt
- [ ] Titel, Datum, Zeit, Ort vollständig
- [ ] Kurz- und Langbeschreibung verständlich und einladend
- [ ] Bild vorhanden und freigegeben
- [ ] Tickets/Preise (falls nötig) korrekt
- [ ] Publiziert
- [ ] Sichtbarkeit geprüft:
  - [ ] auf [hvwinterthur.ch/programm](https://www.hvwinterthur.ch/programm)
  - [ ] bei Museum-Schaffen-Anlässen: später auch auf museumschaffen.ch erwarten
- [ ] Bei Bedarf Mitglieder-Mail in Webling geplant

---

## 6. Häufige Fehler & Tipps

| Problem | Ursache | Lösung |
|---|---|---|
| Anlass fehlt auf museumschaffen.ch | Falsche Org (nicht `5116588`) | Veranstalter auf Museum Schaffen setzen |
| Anlass erscheint unerwünscht auf museumschaffen.ch | Museum-Schaffen-Org gewählt | Auf HVW-Org umstellen |
| Anlass fehlt auf HVW-Programm | Nicht publiziert, oder Org ausserhalb der drei IDs | Publizieren / Org korrigieren |
| Mail ging an Austritte | Gruppe «aktive Mitglieder» nicht gewählt | Immer diese Gruppe auswählen, nie die Gesamtliste |
| Link im Mail tot / veraltet | Falsche URL | Soft-Launch: `/programm` verwenden |
| Startseiten-Karten noch alt | Cache / periodischer Abruf | Später erneut prüfen; Widget auf /programm ist aktueller |
| Doppelte Events | Zweimal erfasst unter verschiedenen Orgs | Altes Event depublizieren |

**Tipps**

- Texte in Eventfrog so schreiben, dass sie sowohl für Website als auch für das Webling-Mail als Grundlage dienen.
- Für wiederkehrende Mailings eine Webling-Vorlage mit Platzhaltern und festem Agenda-Button pflegen.
- OrgID-Thema einmal im Vorstand üben: zwei Beispiel-Events (Museum vs. Verein) gemeinsam durchspielen.

---

## 7. Mail-Vorlage (Textbaustein)

Zum Kopieren nach Webling (Platzhalter an eure Felder anpassen):

**Betreff (Beispiel):**  
`Einladung: [Titel der nächsten Veranstaltung] — und weitere Termine`

**Text:**

```text
Guten Tag <<Vorname>>

wir freuen uns, Sie auf die kommenden Veranstaltungen des Historischen
Vereins Winterthur aufmerksam zu machen.

—— Highlight ——
[Titel]
[Datum], [Uhrzeit]
[Ort]

[3–6 Sätze: Worum geht es? Warum mitkommen? Für wen besonders interessant?]
[Optional: Ticket-/Preis-/Anmeldehinweis]

—— Weitere Termine ——
• [Datum] — [Titel] ([Ort])
• [Datum] — [Titel] ([Ort])
• [Datum] — [Titel] ([Ort])

Alle Details und das laufende Programm finden Sie auf unserer Agenda:

https://www.hvwinterthur.ch/programm

Wir freuen uns, Sie bald persönlich begrüssen zu dürfen.

Herzliche Grüsse
Der Vorstand
Historischer Verein Winterthur
```

Button-Text im Webling-Design: **Zur Agenda** → URL wie oben.

---

## 8. Glossar

| Begriff | Bedeutung |
|---|---|
| **Webling** | Vereinssoftware für Mitgliederverwaltung und Mailings (`hvwinterthur.webling.ch`) |
| **Eventfrog** | Plattform für Event-Erfassung, Tickets und öffentliche Eventseiten |
| **OrgID** | Numerische ID einer Eventfrog-Organisation/Veranstalters; steuert die Ausspielung |
| **Veranstalter** | Die in Eventfrog gewählte Organisation hinter einem Event |
| **Publizieren** | Event öffentlich schalten; Voraussetzung für Website/Exporte |
| **Agenda / Programm** | Öffentliche Terminübersicht auf der HVW-Website |
| **Coucou-Export** | Täglicher JSON-Export für das Kulturmagazin Coucou (alle drei OrgIDs) |
| **mus_export** | Täglicher JSON-Export nur für Museum Schaffen (OrgID `5116588`) |

---

## Anhang: Technische Referenz (für IT / Webmaster)

Nur zur Orientierung — für den Alltagsprozess des Vorstands nicht nötig:

| Komponente | OrgIDs | Ort im Projekt |
|---|---|---|
| Agenda-/Programm-Embed | `4936116`, `5116588`, `5137433` | `agenda.html`, `programm/index.html` |
| Startseiten-Events | dieselben | `scripts/fetch-eventfrog-events.mjs` |
| Coucou-Export | dieselben | `cronjobs/eventfrog_to_coucou.py` |
| Museum-Schaffen-Export | nur `5116588` | `cronjobs/eventfrog_to_mus.py` |
| Webling-Anmeldeformular (öffentlich) | — | `mitmachen.html`, `data/webling-form.json` |

---

*Dokumentversion: 1.0 · Historischer Verein Winterthur · Ausbildungs- und Nachschlagewerk für Vorstand*  
*Bei Änderungen an OrgIDs oder URLs dieses Dokument mitführen.*
