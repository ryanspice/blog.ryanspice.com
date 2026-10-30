<?php
declare(strict_types=1);

function load($event): array {
	$params = $event['params'] ?? [];
	$slug = (string) ($params['slug'] ?? '');
	$base = defined('SK_BASE_PATH') ? (string) SK_BASE_PATH : (string) (getenv('SK_BASE_PATH') ?: '');
	$base = rtrim($base, '/');
	$target = $base . '/briefs/' . ($slug === '' ? '' : '?slug=' . rawurlencode($slug));
	header('Location: ' . $target, true, 302);
	exit;
}
