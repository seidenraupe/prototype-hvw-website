/**
 * Rückblick-Karten nach Monat/Jahr im Kicker absteigend sortieren.
 * Erkennt «Nov. 2025», «Nov:2025», «März 2026» und «3:2025».
 */
(function (global) {
  const MONTHS = {
    januar: 1,
    jan: 1,
    februar: 2,
    feb: 2,
    maerz: 3,
    marz: 3,
    mar: 3,
    april: 4,
    apr: 4,
    mai: 5,
    juni: 6,
    jun: 6,
    juli: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sept: 9,
    sep: 9,
    oktober: 10,
    okt: 10,
    november: 11,
    nov: 11,
    dezember: 12,
    dez: 12,
  };

  function parseEventMonthYear(text) {
    const cleaned = String(text || "")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const yearMatch = cleaned.match(/\b((?:19|20)\d{2})\b/);
    if (!yearMatch) return -1;
    const year = parseInt(yearMatch[1], 10);
    const before = cleaned.slice(0, yearMatch.index);
    const named = before.match(/([a-z]+)[^a-z0-9]*$/);
    if (named && MONTHS[named[1]]) {
      return year * 12 + MONTHS[named[1]];
    }
    const numeric = before.match(/(?:^|[^0-9])(1[0-2]|0?[1-9])[^0-9]*$/);
    if (numeric) {
      return year * 12 + parseInt(numeric[1], 10);
    }
    return -1;
  }

  function kickerText(card) {
    const el = card.querySelector('[data-content$=".kicker"]');
    return el ? el.textContent || "" : "";
  }

  function sortRueckblickCards() {
    const doc = global.document;
    if (!doc) return;
    const grid = doc.querySelector("[data-rueckblick-grid]");
    if (!grid) return;
    const cards = Array.prototype.slice.call(grid.querySelectorAll(":scope > .event-card"));
    if (cards.length < 2) return;
    const ranked = cards.map(function (card, index) {
      return { card: card, index: index, key: parseEventMonthYear(kickerText(card)) };
    });
    ranked.sort(function (a, b) {
      if (b.key !== a.key) return b.key - a.key;
      return a.index - b.index;
    });
    let changed = false;
    for (let i = 0; i < ranked.length; i++) {
      if (ranked[i].card !== cards[i]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    ranked.forEach(function (item) {
      item.card.classList.add("event-card--sorted");
      grid.appendChild(item.card);
    });
  }

  global.hvwParseEventDate = parseEventMonthYear;
  global.hvwSortRueckblick = sortRueckblickCards;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseEventMonthYear: parseEventMonthYear,
      sortRueckblickCards: sortRueckblickCards,
    };
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", sortRueckblickCards);
    } else {
      sortRueckblickCards();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
