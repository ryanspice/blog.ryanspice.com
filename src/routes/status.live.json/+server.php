<?php
/**
 * blog.ryanspice.com
 * Live status endpoint for PHP hosting.
 *
 * This is intentionally minimal: counts + latest IDs only.
 * Backups remain protected by _backups/.htaccess.
 */

declare(strict_types=1);

function sk_status_list_dirs(string $path): array {
	if (!is_dir($path)) return [];
	$items = @scandir($path);
	if ($items === false) return [];

	$out = [];
	foreach ($items as $item) {
		if ($item === '.' || $item === '..') continue;
		if ($item === '.htaccess') continue;
		if ($item !== '' && $item[0] === '.') continue;
		$full = $path . DIRECTORY_SEPARATOR . $item;
		if (is_dir($full)) $out[] = $item;
	}

	sort($out, SORT_STRING);
	return $out;
}

function sk_status_list_backup_archives(string $path): array {
	if (!is_dir($path)) return [];
	$items = @scandir($path);
	if ($items === false) return [];

	$out = [];
	foreach ($items as $item) {
		if ($item === '.' || $item === '..') continue;
		if ($item === '.htaccess') continue;
		if ($item !== '' && $item[0] === '.') continue;
		if (!preg_match('/\\.tar\\.gz$/i', $item)) continue;
		$full = $path . DIRECTORY_SEPARATOR . $item;
		if (is_file($full)) $out[] = $item;
	}

	sort($out, SORT_STRING);
	return $out;
}

function sk_status_sum_sizes(string $dir, array $files): int {
	$total = 0;
	foreach ($files as $file) {
		$full = $dir . DIRECTORY_SEPARATOR . $file;
		$size = @filesize($full);
		if (is_int($size) && $size > 0) $total += $size;
	}
	return $total;
}

function GET($event) {
	$root = realpath(__DIR__ . DIRECTORY_SEPARATOR . '..');

	$releasesDir = $root ? ($root . DIRECTORY_SEPARATOR . '_releases') : '';
	$backupsDir = $root ? ($root . DIRECTORY_SEPARATOR . '_backups') : '';

	$releases = sk_status_list_dirs($releasesDir);
	$backups = sk_status_list_backup_archives($backupsDir);

	return [
		'status' => 200,
		'headers' => [
			'Content-Type' => 'application/json; charset=utf-8',
			'Cache-Control' => 'no-store'
		],
		'body' => [
			'ok' => true,
			'serverTimeUtc' => gmdate('c'),
			'releases' => [
				'count' => count($releases),
				'latest' => count($releases) ? $releases[count($releases) - 1] : null
			],
			'backups' => [
				'count' => count($backups),
				'latest' => count($backups) ? $backups[count($backups) - 1] : null,
				'totalBytes' => sk_status_sum_sizes($backupsDir, $backups)
			]
		]
	];
}

