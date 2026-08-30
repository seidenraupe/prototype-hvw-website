<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/redaktion/lib.php';

$live = hvw_live()['fields'];
$draftMissingNew = $live;
foreach (array_keys($live) as $id) {
    if (
        str_starts_with($id, 'agenda.')
        || str_starts_with($id, 'mitmachen.')
        || str_starts_with($id, 'publikationen.')
        || str_starts_with($id, 'sammlung.')
        || str_starts_with($id, 'zitate.')
    ) {
        unset($draftMissingNew[$id]);
    }
}

$changes = hvw_diff($draftMissingNew, $live);
foreach ($changes as $change) {
    if (
        str_starts_with($change['id'], 'agenda.')
        || str_starts_with($change['id'], 'mitmachen.')
        || str_starts_with($change['id'], 'publikationen.')
        || str_starts_with($change['id'], 'sammlung.')
        || str_starts_with($change['id'], 'zitate.')
    ) {
        fwrite(STDERR, "Neue Felder dürfen ohne Entwurf nicht als Änderung gelten: {$change['id']}\n");
        exit(1);
    }
}

$draftEdited = $draftMissingNew;
$draftEdited['ueber-uns.intro'] = 'Heute überarbeiteter Einleitungstext für den Test.';
$changes = hvw_diff($draftEdited, $live);
$ids = array_column($changes, 'id');
if (!in_array('ueber-uns.intro', $ids, true)) {
    fwrite(STDERR, "Echte Entwurfsänderung an ueber-uns.intro muss sichtbar bleiben.\n");
    exit(1);
}

$draftWhitespace = $live;
$draftWhitespace['agenda.intro'] = "  " . $live['agenda.intro'] . "\n";
$changes = hvw_diff($draftWhitespace, $live);
$ids = array_column($changes, 'id');
if (in_array('agenda.intro', $ids, true)) {
    fwrite(STDERR, "Nur-Leerzeichen am neuen Feld darf keine Änderung sein.\n");
    exit(1);
}

echo "content diff ok\n";
