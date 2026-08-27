<?php
require dirname(__DIR__) . '/zugang/lib.php';

$tz = new DateTimeZone('Europe/Zurich');

$afternoon = (new DateTimeImmutable('2026-08-27 15:30:00', $tz))->getTimestamp();
$end = hvw_zugang_day_end($afternoon);
$expected = (new DateTimeImmutable('2026-08-28 00:00:00', $tz))->getTimestamp();
if ($end !== $expected) {
    fwrite(STDERR, "afternoon day-end mismatch: $end vs $expected\n");
    exit(1);
}
if ($end - $afternoon !== 30600) {
    fwrite(STDERR, "afternoon remaining seconds unexpected: " . ($end - $afternoon) . "\n");
    exit(1);
}

$late = (new DateTimeImmutable('2026-08-27 23:50:00', $tz))->getTimestamp();
$endLate = hvw_zugang_day_end($late);
if ($endLate !== $expected) {
    fwrite(STDERR, "late day-end mismatch\n");
    exit(1);
}

$midnight = (new DateTimeImmutable('2026-08-28 00:00:00', $tz))->getTimestamp();
$endNext = hvw_zugang_day_end($midnight);
$expectedNext = (new DateTimeImmutable('2026-08-29 00:00:00', $tz))->getTimestamp();
if ($endNext !== $expectedNext) {
    fwrite(STDERR, "midnight should roll to next day\n");
    exit(1);
}

if (!hvw_zugang_session_valid($end, $afternoon)) {
    fwrite(STDERR, "same-day midnight cookie should be valid in the afternoon\n");
    exit(1);
}

$rolling12h = $afternoon + 12 * 3600;
if (hvw_zugang_session_valid($rolling12h, $afternoon)) {
    fwrite(STDERR, "12h rolling cookie must not count as calendar-day access\n");
    exit(1);
}

$afterMidnight = (new DateTimeImmutable('2026-08-28 00:05:00', $tz))->getTimestamp();
if (hvw_zugang_session_valid($end, $afterMidnight)) {
    fwrite(STDERR, "yesterday cookie must be invalid after midnight\n");
    exit(1);
}

echo "zugang day-end ok\n";
