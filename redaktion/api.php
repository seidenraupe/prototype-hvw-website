<?php
declare(strict_types=1);

require_once __DIR__ . '/lib.php';

hvw_boot_session();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($action === 'me' && $method === 'GET') {
    $user = hvw_user();
    hvw_json(['ok' => true, 'user' => $user]);
}

if ($action === 'schema' && $method === 'GET') {
    hvw_json(['ok' => true, 'fields' => hvw_schema()]);
}

if ($action === 'login' && $method === 'POST') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = $_POST;
    }
    $id = trim((string) ($body['username'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $users = hvw_users();
    if (!isset($users[$id]) || !password_verify($password, $users[$id]['hash'])) {
        usleep(250000);
        hvw_json(['ok' => false, 'error' => 'Benutzername oder Passwort stimmt nicht.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['user'] = $id;
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    hvw_json(['ok' => true, 'user' => hvw_user()]);
}

if ($action === 'logout' && $method === 'POST') {
    hvw_require_csrf();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], (bool) $p['httponly']);
    }
    session_destroy();
    hvw_json(['ok' => true]);
}

if ($action === 'content' && $method === 'GET') {
    $source = $_GET['source'] ?? 'live';
    if ($source === 'draft') {
        $user = hvw_require_user();
        $draft = hvw_draft();
        $live = hvw_live();
        hvw_json([
            'ok' => true,
            'source' => 'draft',
            'role' => $user['role'],
            'updatedAt' => $draft['updatedAt'] ?? null,
            'updatedBy' => $draft['updatedBy'] ?? null,
            'fields' => $draft['fields'],
            'changes' => hvw_diff($draft['fields'], $live['fields']),
        ]);
    }
    $live = hvw_live();
    hvw_json([
        'ok' => true,
        'source' => 'live',
        'updatedAt' => $live['updatedAt'] ?? null,
        'updatedBy' => $live['updatedBy'] ?? null,
        'fields' => $live['fields'],
    ]);
}

if ($action === 'save' && $method === 'POST') {
    $user = hvw_require_user();
    hvw_require_csrf();
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body) || !isset($body['fields']) || !is_array($body['fields'])) {
        hvw_json(['ok' => false, 'error' => 'Keine Texte empfangen.'], 400);
    }
    $fields = hvw_normalize_fields($body['fields']);
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $draft = [
        'updatedAt' => $now,
        'updatedBy' => $user['id'],
        'status' => 'draft',
        'fields' => $fields,
    ];
    hvw_write_json(HVW_DRAFT, $draft);
    $live = hvw_live();
    hvw_json([
        'ok' => true,
        'updatedAt' => $now,
        'changes' => hvw_diff($fields, $live['fields']),
    ]);
}

if ($action === 'publish' && $method === 'POST') {
    $user = hvw_require_user();
    hvw_require_csrf();
    if ($user['role'] !== 'freigabe') {
        hvw_json(['ok' => false, 'error' => 'Nur die Freigabe-Rolle darf live schalten.'], 403);
    }
    $draft = hvw_draft();
    $fields = hvw_normalize_fields($draft['fields'] ?? []);
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $live = [
        'updatedAt' => $now,
        'updatedBy' => $user['id'],
        'publishedFrom' => $draft['updatedAt'] ?? $now,
        'fields' => $fields,
    ];
    hvw_write_json(HVW_LIVE, $live);
    $draft['status'] = 'published';
    $draft['publishedAt'] = $now;
    $draft['fields'] = $fields;
    hvw_write_json(HVW_DRAFT, $draft);
    hvw_json(['ok' => true, 'updatedAt' => $now]);
}

if ($action === 'discard' && $method === 'POST') {
    $user = hvw_require_user();
    hvw_require_csrf();
    $live = hvw_live();
    $draft = [
        'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'updatedBy' => $user['id'],
        'status' => 'discarded',
        'fields' => $live['fields'] ?? [],
    ];
    hvw_write_json(HVW_DRAFT, $draft);
    hvw_json(['ok' => true]);
}

hvw_json(['ok' => false, 'error' => 'Unbekannte Aktion.'], 404);
