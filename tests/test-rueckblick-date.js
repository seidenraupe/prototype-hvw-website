#!/usr/bin/env node
"use strict";

const assert = require("assert");
const { parseEventMonthYear } = require("../js/rueckblick-date.js");

const cases = [
  ["Vortrag · Nov. 2025", 2025 * 12 + 11],
  ["Führung · Sep. 2025", 2025 * 12 + 9],
  ["Vernissage · Mai 2025", 2025 * 12 + 5],
  ["Konzert · Mär. 2025", 2025 * 12 + 3],
  ["Fest · Jan. 2025", 2025 * 12 + 1],
  ["Stadtspaziergang · Okt. 2024", 2024 * 12 + 10],
  ["Nov:2025", 2025 * 12 + 11],
  ["März:2026", 2026 * 12 + 3],
  ["(Mai:2024)", 2024 * 12 + 5],
  ["3:2025", 2025 * 12 + 3],
  ["September 2026", 2026 * 12 + 9],
  ["ohne datum", -1],
];

cases.forEach(([text, expected]) => {
  const got = parseEventMonthYear(text);
  assert.strictEqual(got, expected, JSON.stringify(text) + " => " + got + " expected " + expected);
});

const liveOrder = [
  "Vortrag · Nov. 2025",
  "Führung · Sep. 2025",
  "Vernissage · Mai 2025",
  "Konzert · Mär. 2025",
  "Fest · Jan. 2025",
  "Stadtspaziergang · Okt. 2024",
];
const shuffled = [liveOrder[5], liveOrder[2], liveOrder[0], liveOrder[4], liveOrder[1], liveOrder[3]];
const sorted = shuffled.slice().sort((a, b) => parseEventMonthYear(b) - parseEventMonthYear(a));
assert.deepStrictEqual(sorted, liveOrder);

const newerFirst = ["Okt. 2024", "März:2026", "Nov. 2025"].sort(
  (a, b) => parseEventMonthYear(b) - parseEventMonthYear(a)
);
assert.deepStrictEqual(newerFirst, ["März:2026", "Nov. 2025", "Okt. 2024"]);

console.log("rueckblick date sort ok");
