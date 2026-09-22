<?php
require dirname(__DIR__) . '/redaktion/lib.php';

$ok = hvw_sanitize_image_path('data/uploads/rueckblick-3-ab12cd34.jpg');
if ($ok !== 'data/uploads/rueckblick-3-ab12cd34.jpg') {
    fwrite(STDERR, "gültiger Upload-Pfad wurde verworfen\n");
    exit(1);
}
if (hvw_sanitize_image_path('../etc/passwd') !== '') {
    fwrite(STDERR, "Pfadtraversal nicht blockiert\n");
    exit(1);
}
if (hvw_sanitize_image_path('https://evil.example/x.jpg') !== '') {
    fwrite(STDERR, "externe URL nicht blockiert\n");
    exit(1);
}
if (hvw_sanitize_image_path('images/placeholder-event-2.svg') !== 'images/placeholder-event-2.svg') {
    fwrite(STDERR, "Platzhalter muss erlaubt bleiben\n");
    exit(1);
}
if (hvw_image_slot('agenda.rueckblick.4.image') !== 4) {
    fwrite(STDERR, "Slot-Erkennung fehlgeschlagen\n");
    exit(1);
}
if (hvw_image_slot('agenda.rueckblick.1.title') !== null) {
    fwrite(STDERR, "Titel darf kein Bild-Slot sein\n");
    exit(1);
}

$schema = hvw_schema();
$incoming = [];
foreach ($schema as $id => $meta) {
    if (!empty($meta['type']) && $meta['type'] === 'image') {
        $incoming[$id] = '';
    } else {
        $incoming[$id] = 'Test';
    }
}
$incoming['agenda.rueckblick.1.image'] = 'data/uploads/rueckblick-1-aabbccdd.jpg';
$normalized = hvw_normalize_fields($incoming, $incoming);
if ($normalized['agenda.rueckblick.1.image'] !== 'data/uploads/rueckblick-1-aabbccdd.jpg') {
    fwrite(STDERR, "Normalize hat Bildpfad verloren\n");
    exit(1);
}
if ($normalized['agenda.rueckblick.2.image'] !== '') {
    fwrite(STDERR, "leeres optionales Bild muss leer bleiben\n");
    exit(1);
}

echo "image fields php ok\n";
