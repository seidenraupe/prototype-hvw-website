/**
 * Historischer Verein Winterthur — Prototyp
 * Event-Karten aus data/home-events.json (Eventfrog, via GitHub Action).
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNewsletter();
  initQuoteChips();
  loadHomeEvents();
  loadWeblingForm();
});

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-nav-mobile]');
  if (!toggle || !mobileNav) return;

  const setOpen = (isOpen) => {
    mobileNav.classList.toggle('hidden', !isOpen);
    mobileNav.classList.toggle('block', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Schliessen' : 'Menü';
  };

  toggle.addEventListener('click', () => {
    const willOpen = mobileNav.classList.contains('hidden');
    setOpen(willOpen);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
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

function initQuoteChips() {
  const quoteChips = document.querySelectorAll('[data-quote-target]');
  const quotePanels = document.querySelectorAll('[data-quote-panel]');
  if (!quoteChips.length || !quotePanels.length) return;

  quoteChips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const id = chip.dataset.quoteTarget;

      quoteChips.forEach((c) => {
        c.classList.remove('is-active', 'bg-hvw-ink', 'text-white');
        c.classList.add('bg-white', 'text-hvw-ink');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active', 'bg-hvw-ink', 'text-white');
      chip.classList.remove('bg-white', 'text-hvw-ink');
      chip.setAttribute('aria-pressed', 'true');

      quotePanels.forEach((panel) => {
        panel.hidden = panel.dataset.quotePanel !== id;
      });
    });
  });
}

async function loadHomeEvents() {
  const container = document.getElementById('home-events');
  if (!container) return;
  await renderEvents(container, { limit: 3 });
}

/**
 * Webling membership form iframe (Mitmachen).
 * URL comes from data/webling-form.json — public form link from Webling admin
 * (Admin → Mitglieder → Formulare → «Öffentlicher Link»).
 */
async function loadWeblingForm() {
  const frame = document.querySelector('[data-webling-frame]');
  const embed = document.querySelector('[data-webling-embed]');
  const fallback = document.querySelector('[data-webling-fallback]');
  if (!frame || !embed) return;

  const showFallback = (message) => {
    embed.innerHTML = `<div class="border-0 bg-hvw-fog p-6 sm:p-8">
      <p class="text-hvw-mute">${escapeHtml(message)}</p>
      <a href="mailto:info@hvwinterthur.ch?subject=Mitgliedschaft%20HVW" class="mt-6 inline-flex min-h-12 items-center bg-hvw-ink px-6 font-semibold text-white no-underline hover:bg-hvw-charcoal">
        Per E-Mail anfragen
      </a>
    </div>`;
    if (fallback) fallback.hidden = true;
  };

  try {
    const response = await fetch('data/webling-form.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const url = typeof data.url === 'string' ? data.url.trim() : '';

    if (!url || !/^https:\/\/[a-z0-9-]+\.webling\.(ch|eu)\/forms\/memberform\/[A-Za-z0-9_-]+\/?$/i.test(url)) {
      showFallback(
        'Das Webling-Anmeldeformular ist noch nicht konfiguriert. Tragen Sie den öffentlichen Formular-Link in data/webling-form.json ein (Webling-Admin → Formulare → Öffentlicher Link).'
      );
      return;
    }

    frame.src = url;
    if (fallback) {
      fallback.hidden = false;
      const link = fallback.querySelector('a');
      if (link) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Formular in neuem Tab öffnen';
      }
    }
  } catch (err) {
    console.error('Webling-Formular konnte nicht geladen werden:', err);
    showFallback(
      'Das Anmeldeformular konnte nicht geladen werden. Bitte melden Sie sich per E-Mail.'
    );
  }
}

async function renderEvents(container, { limit = 3 } = {}) {
  try {
    const response = await fetch('data/home-events.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events.slice(0, limit) : [];

    if (!events.length) {
      container.innerHTML = statusMessage('Aktuell sind keine Veranstaltungen geplant.');
      return;
    }

    container.innerHTML = events
      .map((event, index) => renderEventCard(event, index))
      .join('');

    injectEventJsonLd(events);
  } catch (err) {
    console.error('Veranstaltungen konnten nicht geladen werden:', err);
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
 * Nutzt event.image aus JSON, falls vorhanden; sonst Platzhalter mit Wasserzeichen.
 */
function renderEventCard(event, index = 0) {
  const date = formatEventDate(event.begin);
  const iso = event.begin || '';
  const href = event.url || 'agenda.html';
  const external = Boolean(event.url && /^https?:\/\//.test(event.url));
  const location = event.location || event.organizerName || 'Winterthur';
  const imageIndex = (index % 6) + 1;
  const hasRealImage = Boolean(event.image);
  const imageSrc = hasRealImage
    ? event.image
    : `images/placeholder-event-${imageIndex}.svg`;
  const watermark = hasRealImage
    ? ''
    : `<div class="event-card__watermark" aria-hidden="true"><span>finales Bild fehlt</span></div>`;

  const targetAttrs = external
    ? ' target="_blank" rel="noopener noreferrer"'
    : '';

  return `
    <article class="event-card group flex flex-col border border-hvw-ink bg-white transition-colors duration-200 hover:bg-hvw-fog focus-within:bg-hvw-fog" itemscope itemtype="https://schema.org/Event">
      <a href="${escapeHtml(href)}" class="flex h-full flex-col text-inherit no-underline outline-none"${targetAttrs} aria-label="${escapeHtml(event.title || 'Veranstaltung')}: Details öffnen">
        <div class="event-card__media aspect-[4/3]">
          <img
            src="${escapeHtml(imageSrc)}"
            alt="${escapeHtml(hasRealImage ? (event.title || '') : '')}"
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            itemprop="image">
          ${watermark}
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
    image: event.image || undefined,
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

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}
