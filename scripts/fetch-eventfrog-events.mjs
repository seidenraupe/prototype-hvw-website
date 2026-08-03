#!/usr/bin/env node
/**
 * Fetches the next upcoming events of the Historischer Verein Winterthur
 * (orgIds 4936116, 5116588, 5137433 — Museum Schaffen / Lindengut / weitere)
 * and writes data/home-events.json for the homepage.
 *
 * Primary source: Eventfrog Public API (needs EVENTFROG_API_KEY).
 * Fallback: public Eventfrog embed HTML (same embed key as agenda.html),
 * used when the secret is missing or the API key was deactivated.
 *
 * Usage:
 *   EVENTFROG_API_KEY=<key> node scripts/fetch-eventfrog-events.mjs
 *   node scripts/fetch-eventfrog-events.mjs   # embed fallback
 *
 * Scheduled by .github/workflows/update-eventfrog-events.yml
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.eventfrog.net';
// Eventfrog Organisations-IDs (Museum Schaffen / Lindengut / weitere HVW-Org)
const ORG_IDS = ['4936116', '5116588', '5137433'];
const EVENT_LIMIT = 3;
const OUTPUT_PATH = fileURLToPath(new URL('../data/home-events.json', import.meta.url));

const EMBED_KEY = '78E8E1DA-CCC2-41C9-8C7C-85B14403FAF4';
const EMBED_ORG_QUERY = ORG_IDS.map((id) => `orgId=${id}`).join('&');
const EMBED_URL =
  `https://embed.eventfrog.ch/de/events.html?key=${EMBED_KEY}` +
  `&showSearch=false&disableAddEntry=true&excludeOrgs=false` +
  `&${EMBED_ORG_QUERY}&geoRadius=10`;

const MONTHS_DE = {
  januar: 1,
  februar: 2,
  märz: 3,
  maerz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

const apiKey = (process.env.EVENTFROG_API_KEY || '').trim();

async function fetchJson(path, params) {
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(
      `Eventfrog API request failed (${res.status} ${res.statusText}) for ${url}\n${body}`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json();
}

function pickLang(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.de || field.en || field.fr || '';
}

/** OpenAPI: Event.image is { url, width?, height? } */
function pickImage(event) {
  if (!event || typeof event !== 'object') return '';

  const candidates = [
    event.image?.url,
    event.imageUrl,
    event.imageURL,
    event.flyerUrl,
    event.flyerURL,
    event.thumbnailUrl,
    typeof event.image === 'string' ? event.image : '',
    Array.isArray(event.images) ? event.images[0]?.url || event.images[0] : '',
    event.flyer?.url,
    event.media?.imageUrl,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
      return value.split('?')[0];
    }
  }
  return '';
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&auml;/g, 'ä')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** "Donnerstag, 13. August, 19:00" → ISO in Europe/Zurich offset +02:00/+01:00 approx */
function parseGermanEventTime(timeText, now = new Date()) {
  const cleaned = stripTags(timeText);
  const match = cleaned.match(
    /(\d{1,2})\.\s*([A-Za-zÄÖÜäöü]+)\.?,\s*(\d{1,2}):(\d{2})/
  );
  if (!match) return '';

  const day = Number(match[1]);
  const monthName = match[2].toLowerCase().normalize('NFC');
  const month = MONTHS_DE[monthName] || MONTHS_DE[monthName.replace('ä', 'ae')];
  if (!month) return '';

  const hour = Number(match[3]);
  const minute = Number(match[4]);
  let year = now.getFullYear();

  // Upcoming-only list: if date already passed (with 1-day grace), use next year.
  let candidate = new Date(year, month - 1, day, hour, minute);
  const graceMs = 24 * 60 * 60 * 1000;
  if (candidate.getTime() < now.getTime() - graceMs) {
    year += 1;
    candidate = new Date(year, month - 1, day, hour, minute);
  }

  const pad = (n) => String(n).padStart(2, '0');
  // Events are in Switzerland; embed times are local Zurich wall time.
  const offsetMinutes = getZurichOffsetMinutes(candidate);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${sign}${offH}:${offM}`;
}

function getZurichOffsetMinutes(date) {
  // Difference between Zurich local and UTC for this instant approximation
  const utc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
  // Format the same UTC instant in Zurich and compute offset
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Zurich',
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utc));
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+2';
  const m = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 120;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function extractIdFromUrl(url) {
  const m = String(url).match(/-(\d{10,})\.html/);
  return m ? m[1] : url;
}

async function fetchEventsFromApi() {
  const today = new Date().toISOString().slice(0, 10);

  // perPage bewusst höher als EVENT_LIMIT: über mehrere Orgs hinweg
  // genügend Kandidaten holen, dann die nächsten N nehmen.
  const { events = [] } = await fetchJson('/public/v1/events', {
    orgId: ORG_IDS,
    perPage: Math.max(EVENT_LIMIT * 10, 30),
    country: 'CH',
    from: today,
  });

  const nextEvents = [...events]
    .sort((a, b) => String(a.begin || '').localeCompare(String(b.begin || '')))
    .slice(0, EVENT_LIMIT);

  const locationIds = [...new Set(nextEvents.flatMap((event) => event.locationIds || []))];
  let locationsById = {};
  if (locationIds.length) {
    const { locations = [] } = await fetchJson('/public/v1/locations', { id: locationIds });
    locationsById = Object.fromEntries(locations.map((loc) => [loc.id, loc]));
  }

  return nextEvents.map((event) => {
    const location = locationsById[event.locationIds?.[0]];
    const locationLabel = location
      ? [pickLang(location.title), location.city].filter(Boolean).join(', ')
      : event.organizerName || '';

    const image = pickImage(event);

    return {
      id: String(event.id),
      title: pickLang(event.title),
      begin: event.begin,
      url: event.url,
      organizerName: event.organizerName || '',
      location: locationLabel,
      ...(image ? { image } : {}),
    };
  });
}

async function fetchEventsFromEmbed() {
  const res = await fetch(EMBED_URL, {
    headers: {
      'User-Agent': 'HVW-homepage-events-bot/1.0 (+https://github.com/seidenraupe/prototype-hvw-website)',
      Accept: 'text/html',
    },
  });

  if (!res.ok) {
    throw new Error(`Eventfrog embed request failed (${res.status} ${res.statusText}) for ${EMBED_URL}`);
  }

  const html = await res.text();
  const tileRe = /<a(?=[^>]*class="[^"]*js-event-list-link)[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  const events = [];
  let match;
  while ((match = tileRe.exec(html)) !== null) {
    const [, hrefRaw, body] = match;

    // Skip event groups — homepage wants concrete next dates
    if (/group-indicator/.test(body) || /date--group/.test(body)) continue;

    const hrefPath = decodeHtml(hrefRaw).split('?')[0];
    const url = hrefPath.startsWith('http') ? hrefPath : `https://eventfrog.ch${hrefPath}`;

    const titleMatch = body.match(
      /class="event-list__events__tile__content__infos__title"[^>]*>([\s\S]*?)<\/span>/
    );
    const timeMatch = body.match(
      /class="event-list__events__tile__content__infos__time"[^>]*>([\s\S]*?)<\/span>/
    );
    const locationMatch = body.match(
      /class="event-list__events__tile__content__infos__location"[^>]*>([\s\S]*?)<\/span>/
    );
    const imageMatch = body.match(/<img[^>]+src="([^"]+)"/i);

    const title = stripTags(titleMatch?.[1] || '');
    const begin = parseGermanEventTime(timeMatch?.[1] || '');
    const location = stripTags(locationMatch?.[1] || '')
      .replace(/\s*\(CH\)\s*$/, '')
      .trim();
    const image = imageMatch?.[1] ? imageMatch[1].split('?')[0] : '';

    if (!title || !begin) continue;

    events.push({
      id: extractIdFromUrl(url),
      title,
      begin,
      url,
      organizerName: location.includes('Museum Schaffen')
        ? 'Museum Schaffen'
        : 'Historischer Verein Winterthur',
      location,
      ...(image ? { image } : {}),
    });

    if (events.length >= EVENT_LIMIT) break;
  }

  if (!events.length) {
    throw new Error('Eventfrog embed fallback found no upcoming single events.');
  }

  return events;
}

async function main() {
  let events;
  let source;

  if (apiKey) {
    try {
      events = await fetchEventsFromApi();
      source = 'eventfrog-public-api';
    } catch (err) {
      const deactivated =
        err.status === 401 ||
        err.status === 403 ||
        /deactivated|Unauthorized|Invalid API Key/i.test(String(err.body || err.message || ''));

      if (!deactivated) throw err;

      console.warn(
        'Eventfrog API key missing/invalid/deactivated — falling back to public embed HTML.'
      );
      console.warn(String(err.message).split('\n')[0]);
      events = await fetchEventsFromEmbed();
      source = 'eventfrog-embed-fallback';
    }
  } else {
    console.warn(
      'EVENTFROG_API_KEY is not set — using public Eventfrog embed fallback.\n' +
        'Optional: add a Public API key as GitHub Actions secret EVENTFROG_API_KEY.'
    );
    events = await fetchEventsFromEmbed();
    source = 'eventfrog-embed-fallback';
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source,
    events,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${events.length} event(s) to ${OUTPUT_PATH} (source: ${source})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
