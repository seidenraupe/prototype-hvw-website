#!/usr/bin/env node
/**
 * Fetches the next upcoming events of the Historischer Verein Winterthur
 * (Museum Schaffen / Museum Lindengut) from the Eventfrog Public API and
 * writes a small static JSON file that the homepage loads client-side.
 *
 * This avoids two problems of embedding the Eventfrog iFrame widget
 * directly on the homepage:
 *   1. The iFrame widget has no parameter to hard-limit the number of
 *      displayed events — the only reliable way to show exactly N events
 *      is to fetch the data ourselves and render it.
 *   2. The Eventfrog Public API (api.eventfrog.net) does not send CORS
 *      headers, so it cannot be called directly from browser JavaScript.
 *      Fetching it here (server-side / in CI) and writing the result to a
 *      same-origin static file sidesteps that restriction and keeps the
 *      API key out of the client entirely.
 *
 * Usage:
 *   EVENTFROG_API_KEY=<key> node scripts/fetch-eventfrog-events.mjs
 *
 * In production this is run on a schedule by
 * .github/workflows/update-eventfrog-events.yml, which reads the API key
 * from the repository secret EVENTFROG_API_KEY.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.eventfrog.net';
const ORG_IDS = ['4936116', '5116588'];
const EVENT_LIMIT = 3;
const OUTPUT_PATH = fileURLToPath(new URL('../data/home-events.json', import.meta.url));

const apiKey = process.env.EVENTFROG_API_KEY;
if (!apiKey) {
  console.error('Error: EVENTFROG_API_KEY environment variable is not set.');
  process.exit(1);
}

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
    throw new Error(`Eventfrog API request failed (${res.status} ${res.statusText}) for ${url}\n${body}`);
  }

  return res.json();
}

function pickLang(field) {
  if (!field) return '';
  return field.de || field.en || field.fr || '';
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const { events = [] } = await fetchJson('/public/v1/events', {
    orgId: ORG_IDS,
    perPage: EVENT_LIMIT,
    country: 'CH',
    from: today,
  });

  const nextEvents = events.slice(0, EVENT_LIMIT);

  const locationIds = [...new Set(nextEvents.flatMap((event) => event.locationIds || []))];
  let locationsById = {};
  if (locationIds.length) {
    const { locations = [] } = await fetchJson('/public/v1/locations', { id: locationIds });
    locationsById = Object.fromEntries(locations.map((loc) => [loc.id, loc]));
  }

  const result = nextEvents.map((event) => {
    const location = locationsById[event.locationIds?.[0]];
    const locationLabel = location
      ? [pickLang(location.title), location.city].filter(Boolean).join(', ')
      : event.organizerName || '';

    return {
      id: event.id,
      title: pickLang(event.title),
      begin: event.begin,
      url: event.url,
      organizerName: event.organizerName || '',
      location: locationLabel,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    events: result,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${result.length} event(s) to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
