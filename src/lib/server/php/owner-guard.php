<?php
declare(strict_types=1);

/**
 * Owner verification for private draft content.
 *
 * This file is copied into the private content root at build time and is not
 * reachable from the public document root. It deliberately has no hard-coded
 * owner identity; the canonical build derives the owner hash from the existing
 * site configuration (or BLOG_OWNER_EMAIL_SHA256) and writes owner.json next to
 * this file. Missing owner configuration denies access.
 */

final class BlogPrivateOwnerConfigMissing extends RuntimeException {}
final class BlogPrivateOwnerUnauthorized extends RuntimeException {}
final class BlogPrivateOwnerForbidden extends RuntimeException {}

function blog_private_owner_hash(): string
{
    $candidates = [];

    $configured = getenv('BLOG_OWNER_EMAIL_SHA256');
    if (is_string($configured) && trim($configured) !== '') {
        $candidates[] = $configured;
    }

    $ownerFile = __DIR__ . DIRECTORY_SEPARATOR . 'owner.json';
    if (is_file($ownerFile)) {
        $raw = file_get_contents($ownerFile);
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['ownerEmailSha256'])) {
                $candidates[] = (string) $decoded['ownerEmailSha256'];
            }
        }
    }

    foreach ($candidates as $candidate) {
        $normalized = strtolower(trim((string) preg_replace('/^sha256:/i', '', trim((string) $candidate))));
        if (preg_match('/^[a-f0-9]{64}$/', $normalized)) {
            return $normalized;
        }
    }

    throw new BlogPrivateOwnerConfigMissing('Owner configuration is missing.');
}

function blog_private_owner_token(array $event): string
{
    $header = '';

    $request = $event['request'] ?? null;
    if (is_object($request) && isset($request->headers) && is_array($request->headers)) {
        foreach ($request->headers as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) {
                $header = is_array($value) ? (string) reset($value) : (string) $value;
                break;
            }
        }
    }

    if ($header === '') {
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $serverKey) {
            if (isset($_SERVER[$serverKey]) && is_string($_SERVER[$serverKey])) {
                $header = $_SERVER[$serverKey];
                break;
            }
        }
    }

    $header = trim($header);
    if ($header === '') {
        throw new BlogPrivateOwnerUnauthorized('Missing Microsoft owner token.');
    }

    if (strlen($header) > 8192 || !preg_match('/^Bearer\s+([A-Za-z0-9._~+\/=-]+)$/i', $header, $match)) {
        throw new BlogPrivateOwnerUnauthorized('Invalid Microsoft owner token.');
    }

    return $match[1];
}

function blog_private_owner_assert_token(string $token, string $allowedHash): void
{
    if ($token === '' || strlen($token) > 8192) {
        throw new BlogPrivateOwnerUnauthorized('Invalid Microsoft owner token.');
    }

    $url = 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer " . $token . "\r\nAccept: application/json\r\n",
            'timeout' => 12
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    if (!is_string($response) || $response === '') {
        throw new BlogPrivateOwnerUnauthorized('Microsoft owner token could not be verified.');
    }

    $profile = json_decode($response, true);
    if (!is_array($profile)) {
        throw new BlogPrivateOwnerUnauthorized('Microsoft owner profile response was invalid.');
    }

    $mail = blog_private_owner_email($profile['mail'] ?? '');
    $upn = blog_private_owner_email($profile['userPrincipalName'] ?? '');

    if (
        !hash_equals($allowedHash, blog_private_owner_email_hash($mail))
        && !hash_equals($allowedHash, blog_private_owner_email_hash($upn))
    ) {
        throw new BlogPrivateOwnerForbidden('This Microsoft account is not allowed to read private drafts.');
    }
}

function blog_private_owner_email($value): string
{
    return strtolower(trim((string) $value));
}

function blog_private_owner_email_hash(string $email): string
{
    return $email === '' ? '' : hash('sha256', $email);
}
