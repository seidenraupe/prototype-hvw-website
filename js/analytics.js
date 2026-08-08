/**
 * Google Analytics 4 (gtag.js) — Soft-Launch / Website
 * Lädt nur, wenn data/analytics.json eine gültige Measurement ID enthält.
 */
(function initAnalytics() {
  const CONFIG_URL = '/data/analytics.json';

  function isValidMeasurementId(id) {
    return typeof id === 'string' && /^G-[A-Z0-9]+$/i.test(id.trim());
  }

  function loadGtag(measurementId) {
    const id = measurementId.trim();
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', id, {
      anonymize_ip: true,
      send_page_view: true,
    });
  }

  fetch(CONFIG_URL, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : null))
    .then((config) => {
      if (!config || !isValidMeasurementId(config.measurementId)) {
        return;
      }
      loadGtag(config.measurementId);
    })
    .catch(() => {
      /* Analytics optional — Soft-Launch ohne ID bleibt funktionsfähig */
    });
})();
