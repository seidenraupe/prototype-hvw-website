/**
 * Historischer Verein Winterthur — Prototyp
 * Event-Karten aus data/home-events.json (Eventfrog, via GitHub Action).
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initNewsletter();
  initStimmenRotate();
  loadHomeEvents();
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

/**
 * Perspektiven: ein Statement + Foto aus data/stimmen.json, wechselnd.
 */
async function initStimmenRotate() {
  const root = document.querySelector('[data-stimmen-rotate]');
  if (!root) return;

  const imageEl = root.querySelector('[data-stimmen-image]');
  const questionEl = root.querySelector('[data-stimmen-question]');
  const quoteEl = root.querySelector('[data-stimmen-quote]');
  const nameEl = root.querySelector('[data-stimmen-name]');
  const roleEl = root.querySelector('[data-stimmen-role]');
  const countEl = root.querySelector('[data-stimmen-count]');
  const prevBtn = root.querySelector('[data-stimmen-prev]');
  const nextBtn = root.querySelector('[data-stimmen-next]');
  if (!imageEl || !quoteEl || !nameEl) return;

  let slides = [];
  try {
    const response = await fetch('data/stimmen.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const people = Array.isArray(data.people) ? data.people : [];
    slides = people.flatMap((person) =>
      (person.statements || []).map((statement) => ({
        name: person.name || '',
        role: person.role || '',
        image: person.image || 'images/placeholder-quote.svg',
        question: statement.question || '',
        text: statement.text || '',
      }))
    );
  } catch (err) {
    console.error('Stimmen konnten nicht geladen werden:', err);
    return;
  }

  if (!slides.length) return;

  let index = 0;
  let timer = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intervalMs = 9000;

  const wrapQuote = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('«') || trimmed.startsWith('"') || trimmed.startsWith('„')) {
      return trimmed;
    }
    return `«${trimmed}»`;
  };

  const render = () => {
    const slide = slides[index];
    imageEl.src = slide.image;
    imageEl.alt = slide.name;
    if (questionEl) questionEl.textContent = slide.question;
    quoteEl.textContent = wrapQuote(slide.text);
    nameEl.textContent = slide.name;
    if (roleEl) roleEl.textContent = slide.role;
    if (countEl) countEl.textContent = `${index + 1} / ${slides.length}`;
  };

  const go = (delta) => {
    index = (index + delta + slides.length) % slides.length;
    render();
    restartTimer();
  };

  const restartTimer = () => {
    if (timer) window.clearInterval(timer);
    if (reduceMotion || slides.length < 2) return;
    timer = window.setInterval(() => {
      index = (index + 1) % slides.length;
      render();
    }, intervalMs);
  };

  prevBtn?.addEventListener('click', () => go(-1));
  nextBtn?.addEventListener('click', () => go(1));

  root.addEventListener('mouseenter', () => {
    if (timer) window.clearInterval(timer);
  });
  root.addEventListener('mouseleave', restartTimer);
  root.addEventListener('focusin', () => {
    if (timer) window.clearInterval(timer);
  });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) restartTimer();
  });

  render();
  restartTimer();
}

async function loadHomeEvents() {
  const container = document.getElementById('home-events');
  if (!container) return;
  await renderEvents(container, { limit: 3 });
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
