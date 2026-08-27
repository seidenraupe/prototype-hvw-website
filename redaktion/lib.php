<?php
/**
 * HVW-Redaktion: Auth, Speichern, Freigabe.
 */

declare(strict_types=1);

define('HVW_ROOT', dirname(__DIR__));
define('HVW_SCHEMA', HVW_ROOT . '/data/content-schema.json');
define('HVW_LIVE', HVW_ROOT . '/data/content-live.json');
define('HVW_DRAFT', __DIR__ . '/storage/content-draft.json');
define('HVW_ALLOWED_TAGS', ['strong', 'em', 'u', 'br']);

function hvw_cookie_path(): string
{
    $script = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/'));
    $base = preg_replace('#/redaktion(?:/.*)?$#', '', $script);
    if (!is_string($base) || $base === '') {
        return '/';
    }
    return rtrim($base, '/') . '/';
}

function hvw_boot_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('hvw_redaktion');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => hvw_cookie_path(),
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}

function hvw_users(): array
{
    $users = [
        'redaktion' => [
            'role' => 'redaktion',
            'name' => 'Redaktion',
            'hash' => '$2y$10$JsbUkaA9zXuQnZLCk2IFbuuEf7FQD3yqf4yvqhFGz.3AXHEqqg/fW',
        ],
        'freigabe' => [
            'role' => 'freigabe',
            'name' => 'Freigabe',
            'hash' => '$2y$10$7BnB6ia5KzRATNupk9pUx.vV3B/LWCqqIknLFyScwBMVNWC5jR7Ge',
        ],
    ];
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $override = require $local;
        if (is_array($override) && $override) {
            $users = $override;
        }
    }
    return $users;
}

function hvw_user(): ?array
{
    hvw_boot_session();
    if (empty($_SESSION['user'])) {
        return null;
    }
    $id = (string) $_SESSION['user'];
    $users = hvw_users();
    if (!isset($users[$id])) {
        return null;
    }
    return [
        'id' => $id,
        'role' => $users[$id]['role'],
        'name' => $users[$id]['name'],
        'csrf' => $_SESSION['csrf'],
    ];
}

function hvw_require_user(): array
{
    $user = hvw_user();
    if (!$user) {
        hvw_json(['ok' => false, 'error' => 'Bitte anmelden.'], 401);
    }
    return $user;
}

function hvw_require_csrf(): void
{
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals((string) ($_SESSION['csrf'] ?? ''), (string) $sent)) {
        hvw_json(['ok' => false, 'error' => 'Sitzung abgelaufen. Bitte neu anmelden.'], 403);
    }
}

function hvw_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hvw_read_json(string $path): array
{
    if (!is_file($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : [];
}

function hvw_write_json(string $path, array $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Speicherordner fehlt.');
    }
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new RuntimeException('JSON konnte nicht geschrieben werden.');
    }
    $tmp = $path . '.tmp';
    if (file_put_contents($tmp, $json . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Datei konnte nicht gespeichert werden.');
    }
    if (!rename($tmp, $path)) {
        throw new RuntimeException('Datei konnte nicht ersetzt werden.');
    }
}

function hvw_schema(): array
{
    $data = hvw_read_json(HVW_SCHEMA);
    $fields = $data['fields'] ?? [];
    return is_array($fields) ? $fields : [];
}

function hvw_plain_len(string $html): int
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    return function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
}

function hvw_sanitize_rich(string $html): string
{
    $html = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $html) ?? '';
    $html = str_ireplace(['<b>', '</b>'], ['<strong>', '</strong>'], $html);
    $html = str_ireplace(['<i>', '</i>'], ['<em>', '</em>'], $html);
    $html = strip_tags($html, '<' . implode('><', HVW_ALLOWED_TAGS) . '>');
    $html = preg_replace('/<(strong|em|u|br)\b[^>]*>/i', '<$1>', $html) ?? $html;
    $html = preg_replace('/<\/(strong|em|u)\b[^>]*>/i', '</$1>', $html) ?? $html;
    $html = preg_replace('/<br\s*\/?>/i', '<br>', $html) ?? $html;
    return trim($html);
}

function hvw_sanitize_plain(string $html): string
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
    return $text;
}

function hvw_seed_fields(): array
{
    $path = HVW_ROOT . '/data/content-live.seed.json';
    if (!is_file($path)) {
        $path = HVW_LIVE;
    }
    $data = hvw_read_json($path);
    $fields = $data['fields'] ?? [];
    return is_array($fields) ? $fields : [];
}

function hvw_fallback_fields(): array
{
    $live = hvw_live()['fields'] ?? [];
    $draft = [];
    if (is_file(HVW_DRAFT)) {
        $draft = hvw_read_json(HVW_DRAFT)['fields'] ?? [];
    }
    $draft = is_array($draft) ? $draft : [];
    $live = is_array($live) ? $live : [];
    return array_merge(hvw_seed_fields(), $live, $draft);
}

function hvw_normalize_fields(array $incoming, ?array $fallback = null): array
{
    $schema = hvw_schema();
    $fallback = $fallback ?? hvw_fallback_fields();
    $out = [];
    $errors = [];
    foreach ($schema as $id => $meta) {
        if (!array_key_exists($id, $incoming)) {
            if (array_key_exists($id, $fallback)) {
                $incoming[$id] = $fallback[$id];
            } else {
                $errors[] = 'Feld fehlt: ' . $id;
                continue;
            }
        }
        $raw = (string) $incoming[$id];
        $rich = !empty($meta['rich']);
        $value = $rich ? hvw_sanitize_rich($raw) : hvw_sanitize_plain($raw);
        $len = hvw_plain_len($value);
        $max = (int) ($meta['max'] ?? 400);
        if ($len < 1) {
            $errors[] = ($meta['label'] ?? $id) . ' darf nicht leer sein.';
        } elseif ($len > $max) {
            $errors[] = ($meta['label'] ?? $id) . " ist zu lang ({$len} von {$max} Zeichen).";
        }
        $out[$id] = $value;
    }
    if ($errors) {
        hvw_json(['ok' => false, 'error' => implode(' ', $errors), 'errors' => $errors], 422);
    }
    return $out;
}

function hvw_live(): array
{
    $data = hvw_read_json(HVW_LIVE);
    $data['fields'] = is_array($data['fields'] ?? null) ? $data['fields'] : [];
    return $data;
}

function hvw_draft(): array
{
    if (!is_file(HVW_DRAFT)) {
        $live = hvw_live();
        $live['status'] = 'clean';
        return $live;
    }
    $data = hvw_read_json(HVW_DRAFT);
    $data['fields'] = is_array($data['fields'] ?? null) ? $data['fields'] : [];
    return $data;
}

function hvw_diff(array $draftFields, array $liveFields): array
{
    $schema = hvw_schema();
    $changes = [];
    foreach ($schema as $id => $meta) {
        $a = (string) ($liveFields[$id] ?? '');
        $b = (string) ($draftFields[$id] ?? '');
        if ($a !== $b) {
            $changes[] = [
                'id' => $id,
                'label' => $meta['label'] ?? $id,
                'page' => $meta['page'] ?? '',
                'live' => $a,
                'draft' => $b,
            ];
        }
    }
    return $changes;
}
