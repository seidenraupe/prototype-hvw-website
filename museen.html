document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.nav-mobile');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.textContent = isOpen ? 'Schliessen' : 'Menü';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menü';
      });
    });
  }

  const quoteChips = document.querySelectorAll('[data-quote-target]');
  const quotePanels = document.querySelectorAll('[data-quote-panel]');

  if (quoteChips.length && quotePanels.length) {
    quoteChips.forEach(chip => {
      chip.addEventListener('click', e => {
        e.preventDefault();
        const id = chip.dataset.quoteTarget;

        quoteChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');

        quotePanels.forEach(panel => {
          panel.hidden = panel.dataset.quotePanel !== id;
        });
      });
    });
  }

  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      alert('Prototyp: Newsletter-Anmeldung würde hier angebunden werden.');
    });
  }

  loadHomeEvents();
});

// Rendert die 3 nächsten Veranstaltungen (data/home-events.json, periodisch
// per GitHub Action aus der Eventfrog Public API erzeugt) in das
// .events-preview-Grid auf der Startseite. Die Begrenzung auf 3 Events
// erfolgt bereits beim Erzeugen der JSON-Datei (harte Begrenzung serverseitig,
// nicht nur per CSS/Layout).
async function loadHomeEvents() {
  const container = document.getElementById('home-events-preview');
  if (!container) return;

  try {
    const response = await fetch('data/home-events.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events.slice(0, 3) : [];

    if (!events.length) {
      renderHomeEventsStatus(container, 'Aktuell sind keine Veranstaltungen geplant.');
      return;
    }

    container.innerHTML = events.map(renderEventCard).join('');
  } catch (err) {
    console.error('Konnte Eventfrog-Veranstaltungen nicht laden:', err);
    renderHomeEventsStatus(
      container,
      'Veranstaltungen konnten nicht geladen werden. Alle Termine gibt es auf der Agenda-Seite.'
    );
  }
}

function renderHomeEventsStatus(container, text) {
  container.innerHTML = `<p class="events-preview__status">${escapeHtml(text)}</p>`;
}

function renderEventCard(event) {
  const date = formatEventDate(event.begin);
  const href = event.url || 'agenda.html';

  return `
    <a href="${escapeHtml(href)}" class="event-card" target="_blank" rel="noopener">
      <div class="event-card__date">${escapeHtml(date)}</div>
      <div class="event-card__title">${escapeHtml(event.title || '')}</div>
      <div class="event-card__meta">${escapeHtml(event.location || event.organizerName || '')}</div>
    </a>
  `;
}

function formatEventDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  // Events finden in der Schweiz statt — die Uhrzeit soll unabhängig von der
  // Zeitzone des Browsers der Besucherin/des Besuchers immer die Schweizer
  // Lokalzeit zeigen (wie auf dem Ticket / im Eventfrog-Kalender).
  const datePart = date.toLocaleDateString('de-CH', {
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

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}
