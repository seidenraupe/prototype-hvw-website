/**
 * Historischer Verein Winterthur — Prototyp
 * Event-Karten aus data/home-events.json (Eventfrog, via GitHub Action).
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNewsletter();
  loadHomeEvents();
  loadAgendaEvents();
});

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-nav-mobile]');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Schliessen' : 'Menü';
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menü';
    });
  });
}

function initNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Prototyp: Newsletter-Anmeldung würde hier angebunden werden.');
  });
}

async function loadHomeEvents() {
  const container = document.getElementById('home-events');
  if (!container) return;
  await renderEvents(container, { limit: 3, placeholders: true });
}

async function loadAgendaEvents() {
  const container = document.getElementById('agenda-events');
  if (!container) return;
  await renderEvents(container, { limit: 6, placeholders: true, fallbackDemo: true });
}

async function renderEvents(container, { limit = 3, placeholders = true, fallbackDemo = false } = {}) {
  try {
    const response = await fetch('data/home-events.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    let events = Array.isArray(data.events) ? data.events.slice(0, limit) : [];

    if (!events.length && fallbackDemo) {
      events = demoEvents().slice(0, limit);
    }

    if (!events.length) {
      container.innerHTML = statusMessage('Aktuell sind keine Veranstaltungen geplant.');
      return;
    }

    // Für Agenda: Demo-Events ergänzen, damit 2×3 Grid sichtbar ist
    if (fallbackDemo && events.length < limit) {
      const extras = demoEvents().filter((d) => !events.some((e) => e.id === d.id));
      events = [...events, ...extras].slice(0, limit);
    }

    container.innerHTML = events
      .map((event, index) => renderEventCard(event, index, placeholders))
      .join('');

    injectEventJsonLd(events);
  } catch (err) {
    console.error('Veranstaltungen konnten nicht geladen werden:', err);
    if (fallbackDemo) {
      const events = demoEvents().slice(0, limit);
      container.innerHTML = events
        .map((event, index) => renderEventCard(event, index, placeholders))
        .join('');
      injectEventJsonLd(events);
      return;
    }
    container.innerHTML = statusMessage(
      'Veranstaltungen konnten nicht geladen werden. Alle Termine finden Sie auf der Agenda-Seite.'
    );
  }
}

function statusMessage(text) {
  return `<p class="col-span-full rounded-none border border-hvw-ink/15 bg-hvw-fog px-5 py-8 text-center text-hvw-mute">${escapeHtml(text)}</p>`;
}

/**
 * Event-Karte — Tailwind, Mobile First:
 * 1 Spalte (default) · ab md 2 · ab lg 3 (Grid am Container)
 */
function renderEventCard(event, index = 0, withPlaceholder = true) {
  const date = formatEventDate(event.begin);
  const iso = event.begin || '';
  const href = event.url || 'agenda.html';
  const external = Boolean(event.url);
  const location = event.location || event.organizerName || 'Winterthur';
  const imageIndex = (index % 6) + 1;
  const imageSrc = withPlaceholder
    ? `images/placeholder-event-${imageIndex}.svg`
    : event.image || `images/placeholder-event-${imageIndex}.svg`;

  const targetAttrs = external
    ? ' target="_blank" rel="noopener noreferrer"'
    : '';

  return `
    <article class="event-card group flex flex-col border border-hvw-ink bg-white transition-colors duration-200 hover:bg-hvw-fog focus-within:bg-hvw-fog" itemscope itemtype="https://schema.org/Event">
      <a href="${escapeHtml(href)}" class="flex h-full flex-col text-inherit no-underline outline-none"${targetAttrs} aria-label="${escapeHtml(event.title || 'Veranstaltung')}: Details öffnen">
        <div class="event-card__media aspect-[4/3]">
          <img
            src="${escapeHtml(imageSrc)}"
            alt=""
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            itemprop="image">
          <div class="event-card__watermark" aria-hidden="true">
            <span>finales Bild fehlt</span>
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <time
            class="text-sm font-semibold uppercase tracking-[0.08em] text-hvw-mute"
            datetime="${escapeHtml(iso)}"
            itemprop="startDate">
            ${escapeHtml(date)}
          </time>
          <h3 class="text-xl font-semibold leading-snug text-hvw-ink sm:text-2xl" itemprop="name">
            ${escapeHtml(event.title || '')}
          </h3>
          <p class="text-base text-hvw-mute" itemprop="location" itemscope itemtype="https://schema.org/Place">
            <span itemprop="name">${escapeHtml(location)}</span>
          </p>
          <meta itemprop="eventAttendanceMode" content="https://schema.org/OfflineEventAttendanceMode">
          <meta itemprop="eventStatus" content="https://schema.org/EventScheduled">
          <span class="mt-auto inline-flex min-h-12 items-center pt-2 text-base font-semibold text-hvw-ink underline decoration-transparent underline-offset-4 transition group-hover:decoration-hvw-ink group-focus-within:decoration-hvw-ink">
            Details &amp; Tickets
            <span aria-hidden="true" class="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </a>
    </article>
  `;
}

function formatEventDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const datePart = date.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Zurich',
  });
  const timePart = date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich',
  });

  return `${datePart} · ${timePart}`;
}

function injectEventJsonLd(events) {
  const existing = document.getElementById('events-jsonld');
  if (existing) existing.remove();

  const graph = events.map((event) => ({
    '@type': 'Event',
    name: event.title,
    startDate: event.begin,
    url: event.url || undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location || event.organizerName || 'Winterthur',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Winterthur',
        addressRegion: 'ZH',
        addressCountry: 'CH',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizerName || 'Historischer Verein Winterthur',
      url: 'https://www.museumschaffen.ch/',
    },
    image: undefined,
  }));

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'events-jsonld';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
  document.head.appendChild(script);
}

/** Zusätzliche Demo-Termine für das Agenda-Raster (Prototyp) */
function demoEvents() {
  return [
    {
      id: 'demo-1',
      title: 'Vortrag: Winterthur und die Demokratie',
      begin: '2026-09-18T19:30:00+02:00',
      url: 'agenda.html',
      organizerName: 'Historischer Verein Winterthur',
      location: 'Museum Lindengut, Winterthur',
    },
    {
      id: 'demo-2',
      title: 'Führung Schloss Mörsburg',
      begin: '2026-09-27T14:00:00+02:00',
      url: 'agenda.html',
      organizerName: 'Historischer Verein Winterthur',
      location: 'Schloss Mörsburg, Winterthur',
    },
    {
      id: 'demo-3',
      title: 'Kulturnacht Winterthur',
      begin: '2026-09-19T18:00:00+02:00',
      url: 'https://www.museumschaffen.ch/',
      organizerName: 'Museum Schaffen',
      location: 'Museum Schaffen, Winterthur',
    },
  ];
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}
