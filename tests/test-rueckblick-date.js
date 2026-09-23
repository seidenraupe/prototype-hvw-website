#!/usr/bin/env node
const assert = require("assert");
require("../js/rueckblick-date.js");

const parse = global.hvwParseRueckblickDate;
assert.strictEqual(parse("Führung · Juli 2026"), 2026 * 12 + 7);
assert.strictEqual(parse("LESUNG · FEBRUAR 2026"), 2026 * 12 + 2);
assert.strictEqual(parse("Vernissage · Mai 2026"), 2026 * 12 + 5);
assert.strictEqual(parse("Vortrag · Nov. 2025"), 2025 * 12 + 11);
assert.strictEqual(parse("Konzert · Mär. 2025"), 2025 * 12 + 3);
assert.strictEqual(parse("Stadtspaziergang · Okt. 2024"), 2024 * 12 + 10);
assert.strictEqual(parse("NOV:2025"), 2025 * 12 + 11);
assert.strictEqual(parse("25.09.2026"), 2026 * 12 + 9);
assert.strictEqual(parse("ohne Datum"), null);

function card(kicker) {
  return {
    tagName: "ARTICLE",
    text: kicker,
    querySelector() {
      return { textContent: kicker };
    },
  };
}
const cards = [
  card("Führung · Juli 2026"),
  card("Lesung · Februar 2026"),
  card("Vernissage · Mai 2026"),
  card("ohne Datum"),
];
const grid = {
  children: cards.slice(),
  querySelector() {
    return grid;
  },
  appendChild(node) {
    const i = grid.children.indexOf(node);
    if (i >= 0) grid.children.splice(i, 1);
    grid.children.push(node);
  },
};
global.hvwSortRueckblick({ querySelector: () => grid });
assert.deepStrictEqual(
  grid.children.map((item) => item.text),
  ["Führung · Juli 2026", "Vernissage · Mai 2026", "Lesung · Februar 2026", "ohne Datum"]
);

console.log("rueckblick date sort ok");
