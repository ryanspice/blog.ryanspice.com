<?php
declare(strict_types=1);

/**
 * Owner-only private draft delivery endpoint.
 *
 * GET (with Authorization: Bearer <Microsoft access token>) returns either the
 * private draft manifest or one private draft article. The optional finite
 * `kind=briefs` switch returns the private morning-brief manifest or one brief;
 * the default remains `kind=articles` for the existing caller. The owner check
 * runs before any private file is opened. The private payload lives outside the
 * deployable document root and is located through BLOG_PRIVATE_CONTENT_ROOT;
 * there is no public/drafts fallback.
 */

final class BlogOwnerInvalidSlug extends RuntimeException {}
final class BlogOwnerInvalidKind extends RuntimeException {}
final class BlogOwnerUnavailable extends RuntimeException {}

function blog_owner_path_inside(string $parent, string $child): bool
{
    $parent = rtrim($parent, DIRECTORY_SEPARATOR);
    if ($parent === '') return false;
    $prefix = $parent . DIRECTORY_SEPARATOR;

    if (DIRECTORY_SEPARATOR === '\\') {
        $parent = strtolower($parent);
        $prefix = strtolower($prefix);
        $child = strtolower($child);
    }

    return $child === $parent || strpos($child, $prefix) === 0;
}

function blog_owner_root(): ?string
{
    $configured = getenv('BLOG_PRIVATE_CONTENT_ROOT');
    if (!is_string($configured)) return null;

    $configured = trim($configured);
    if ($configured === '') return null;
    if (!preg_match('/^(?:[A-Za-z]:[\\\\\/]|\/)/', $configured)) return null;

    $real = realpath($configured);
    if ($real === false || !is_dir($real)) return null;

    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if (!is_string($documentRoot) || trim($documentRoot) === '') return null;
    $documentRootReal = realpath($documentRoot);
    if ($documentRootReal === false || !is_dir($documentRootReal)) return null;
    if (blog_owner_path_inside($documentRootReal, $real)
        || blog_owner_path_inside($real, $documentRootReal)) return null;

    return rtrim($real, DIRECTORY_SEPARATOR);
}

function blog_owner_headers(): array
{
    return [
        'Content-Type' => 'application/json; charset=utf-8',
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma' => 'no-cache',
        'Vary' => 'Authorization',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'no-referrer'
    ];
}

function blog_owner_error(int $status, string $code): array
{
    return [
        'status' => $status,
        'headers' => blog_owner_headers(),
        'body' => ['ok' => false, 'error' => $code]
    ];
}

function blog_owner_slug(array $event): ?string
{
    $present = false;
    $value = '';

    $url = $event['url'] ?? null;
    if (is_object($url) && isset($url->searchParams) && is_object($url->searchParams) && method_exists($url->searchParams, 'has')) {
        if ($url->searchParams->has('slug')) {
            $present = true;
            $raw = $url->searchParams->get('slug');
            $value = is_string($raw) ? $raw : '';
        }
    }

    if (!$present && array_key_exists('slug', $_GET)) {
        $present = true;
        $raw = $_GET['slug'];
        if (is_array($raw)) throw new BlogOwnerInvalidSlug('Invalid draft slug.');
        $value = is_string($raw) ? $raw : '';
    }

    if (!$present) return null;

    $value = trim($value);
    if ($value === '' || strlen($value) > 160 || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value)) {
        throw new BlogOwnerInvalidSlug('Invalid draft slug.');
    }

    return $value;
}

function blog_owner_kind(array $event): string
{
    $present = false;
    $value = '';

    $url = $event['url'] ?? null;
    if (is_object($url) && isset($url->searchParams) && is_object($url->searchParams) && method_exists($url->searchParams, 'has')) {
        if ($url->searchParams->has('kind')) {
            $present = true;
            $raw = $url->searchParams->get('kind');
            $value = is_string($raw) ? $raw : '';
        }
    }

    if (!$present && array_key_exists('kind', $_GET)) {
        $present = true;
        $raw = $_GET['kind'];
        if (is_array($raw)) throw new BlogOwnerInvalidKind('Invalid private content kind.');
        $value = is_string($raw) ? $raw : '';
    }

    if (!$present) return 'articles';

    $value = strtolower(trim($value));
    if ($value === '') return 'articles';
    if (!in_array($value, ['articles', 'briefs'], true)) {
        throw new BlogOwnerInvalidKind('Unsupported private content kind.');
    }

    return $value;
}

function blog_owner_read_contained(string $root, string $relative): ?string
{
    $candidate = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
    $real = realpath($candidate);
    if ($real === false || !is_file($real)) return null;

    $rootNormalized = rtrim($root, DIRECTORY_SEPARATOR);
    $rootPrefix = $rootNormalized . DIRECTORY_SEPARATOR;
    if (DIRECTORY_SEPARATOR === '\\') {
        $rootNormalized = strtolower($rootNormalized);
        $rootPrefix = strtolower($rootPrefix);
        $realComparable = strtolower($real);
    } else {
        $realComparable = $real;
    }

    if ($realComparable !== $rootNormalized && strpos($realComparable, $rootPrefix) !== 0) {
        return null;
    }

    $raw = file_get_contents($real);
    return is_string($raw) ? $raw : null;
}

function blog_owner_manifest(string $root, string $kind): array
{
    if ($kind === 'briefs') {
        $raw = blog_owner_read_contained($root, 'briefs/manifest.json');
        if ($raw === null) throw new BlogOwnerUnavailable('Private brief manifest is unavailable.');

        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || !isset($decoded['briefs']) || !is_array($decoded['briefs'])) {
            throw new BlogOwnerUnavailable('Private brief manifest is invalid.');
        }

        return [
            'status' => 200,
            'headers' => blog_owner_headers(),
            'body' => ['ok' => true, 'kind' => 'briefs', 'briefs' => $decoded['briefs']]
        ];
    }

    $raw = blog_owner_read_contained($root, 'manifest.json');
    if ($raw === null) throw new BlogOwnerUnavailable('Private draft manifest is unavailable.');

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isset($decoded['articles']) || !is_array($decoded['articles'])) {
        throw new BlogOwnerUnavailable('Private draft manifest is invalid.');
    }

    return [
        'status' => 200,
        'headers' => blog_owner_headers(),
        'body' => ['ok' => true, 'kind' => 'articles', 'articles' => $decoded['articles']]
    ];
}

function blog_owner_brief(string $root, string $slug): array
{
    $raw = blog_owner_read_contained($root, 'briefs/' . $slug . '.json');
    if ($raw === null) return blog_owner_error(404, 'not_found');

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isset($decoded['brief']) || !is_array($decoded['brief'])) {
        throw new BlogOwnerUnavailable('Private brief is invalid.');
    }
    if (($decoded['brief']['slug'] ?? '') !== $slug) {
        throw new BlogOwnerUnavailable('Private brief does not match its slug.');
    }

    return [
        'status' => 200,
        'headers' => blog_owner_headers(),
        'body' => ['ok' => true, 'kind' => 'briefs', 'brief' => $decoded['brief']]
    ];
}

function blog_owner_article(string $root, string $slug): array
{
    $raw = blog_owner_read_contained($root, 'articles/' . $slug . '.json');
    if ($raw === null) return blog_owner_error(404, 'not_found');

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isset($decoded['article']) || !is_array($decoded['article'])) {
        throw new BlogOwnerUnavailable('Private draft article is invalid.');
    }
    if (($decoded['article']['slug'] ?? '') !== $slug) {
        throw new BlogOwnerUnavailable('Private draft article does not match its slug.');
    }

    return [
        'status' => 200,
        'headers' => blog_owner_headers(),
        'body' => ['ok' => true, 'kind' => 'articles', 'article' => $decoded['article']]
    ];
}

function GET($event): array
{
    $root = blog_owner_root();
    if ($root === null) return blog_owner_error(503, 'unavailable');

    $guardFile = realpath($root . DIRECTORY_SEPARATOR . 'owner-guard.php');
    if ($guardFile === false || !is_file($guardFile) || !blog_owner_path_inside($root, $guardFile)) {
        return blog_owner_error(503, 'unavailable');
    }

    require_once $guardFile;

    try {
        $token = blog_private_owner_token(is_array($event) ? $event : []);
        $ownerHash = blog_private_owner_hash();
        blog_private_owner_assert_token($token, $ownerHash);

        $kind = blog_owner_kind(is_array($event) ? $event : []);
        $slug = blog_owner_slug(is_array($event) ? $event : []);
        if ($slug === null) return blog_owner_manifest($root, $kind);
        return $kind === 'briefs' ? blog_owner_brief($root, $slug) : blog_owner_article($root, $slug);
    } catch (BlogPrivateOwnerConfigMissing $error) {
        return blog_owner_error(503, 'unavailable');
    } catch (BlogPrivateOwnerUnauthorized $error) {
        return blog_owner_error(401, 'unauthorized');
    } catch (BlogPrivateOwnerForbidden $error) {
        return blog_owner_error(403, 'forbidden');
    } catch (BlogOwnerInvalidKind $error) {
        return blog_owner_error(400, 'invalid_kind');
    } catch (BlogOwnerInvalidSlug $error) {
        return blog_owner_error(400, 'invalid_slug');
    } catch (BlogOwnerUnavailable $error) {
        return blog_owner_error(503, 'unavailable');
    } catch (Throwable $error) {
        error_log('[blog-owner] private draft read failed');
        return blog_owner_error(500, 'error');
    }
}
