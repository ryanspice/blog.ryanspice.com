<?php
declare(strict_types=1);

function load($event): array {
	$params = $event['params'] ?? [];
	return ['slug' => (string)($params['slug'] ?? '')];
}

function action_save($event): array {
	$params = $event['params'] ?? [];
	$post = $event['post'] ?? $_POST;
	$slug = blog_draft_scalar($params['slug'] ?? '');
	$token = blog_draft_scalar($post['owner_token'] ?? '');

	try {
		blog_draft_assert_owner_token($token);
		$result = blog_draft_save_metadata($slug, $post);
		return [
			'type' => 'success',
			'status' => 200,
			'data' => [
				'metadataSave' => [
					'ok' => true,
					'message' => $result['message'],
					'fileName' => $result['fileName']
				]
			]
		];
	} catch (Throwable $e) {
		return sk_fail(400, [
			'metadataSave' => [
				'ok' => false,
				'message' => $e->getMessage()
			]
		]);
	}
}

function blog_draft_save_metadata(string $slug, array $post): array {
	if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
		throw new RuntimeException('Invalid article slug.');
	}

	$file = blog_draft_find_article_file($slug);
	$raw = file_get_contents($file['path']);
	if (!is_string($raw)) {
		throw new RuntimeException('Unable to read article source file.');
	}

	$current = blog_draft_parse_frontmatter($raw);
	$status = blog_draft_status(blog_draft_scalar($post['status'] ?? 'draft'));
	$publishDate = blog_draft_scalar($post['publish_date'] ?? '') ?: ($current['release_date'] ?? ($current['date'] ?? ''));
	$publishTime = blog_draft_scalar($post['publish_time'] ?? '') ?: ($current['release_time'] ?? '08:15');
	$accent = blog_draft_scalar($post['accent'] ?? '');

	if ($status !== 'draft') {
		if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $publishDate)) {
			throw new RuntimeException('Publish date must use YYYY-MM-DD.');
		}

		if (!preg_match('/^\d{2}:\d{2}$/', $publishTime)) {
			throw new RuntimeException('Publish time must use HH:mm.');
		}
	}

	if ($accent !== '' && !preg_match('/^#[0-9a-fA-F]{6}$/', $accent)) {
		throw new RuntimeException('Accent must be a six-digit hex colour such as #7c5cff.');
	}

	$updates = [
		'status' => $status,
		'updated_date' => blog_draft_today_toronto(),
		'accent' => $accent,
		'image' => blog_draft_visual($post['image'] ?? ''),
		'image_alt' => blog_draft_visual($post['image_alt'] ?? ''),
		'image_credit' => blog_draft_visual($post['image_credit'] ?? ''),
		'image_source' => blog_draft_visual($post['image_source'] ?? ''),
		'image_position' => blog_draft_visual($post['image_position'] ?? ''),
		'row_image' => blog_draft_visual($post['row_image'] ?? ''),
		'row_image_alt' => blog_draft_visual($post['row_image_alt'] ?? ''),
		'row_image_credit' => blog_draft_visual($post['row_image_credit'] ?? ''),
		'row_image_source' => blog_draft_visual($post['row_image_source'] ?? ''),
		'row_image_position' => blog_draft_visual($post['row_image_position'] ?? ''),
		'background_image' => blog_draft_visual($post['background_image'] ?? ''),
		'background_image_alt' => blog_draft_visual($post['background_image_alt'] ?? ''),
		'background_image_credit' => blog_draft_visual($post['background_image_credit'] ?? ''),
		'background_image_source' => blog_draft_visual($post['background_image_source'] ?? ''),
		'background_image_position' => blog_draft_visual($post['background_image_position'] ?? '')
	];

	if ($status === 'draft') {
		$updates['publish_at'] = '';
		$updates['release_date'] = '';
		$updates['release_time'] = '';
	} else {
		$updates['date'] = $publishDate;
		$updates['publish_at'] = $publishDate . 'T' . $publishTime;
		$updates['release_date'] = $publishDate;
		$updates['release_time'] = $publishTime;
	}

	$next = blog_draft_update_frontmatter($raw, $updates);
	if (file_put_contents($file['path'], $next, LOCK_EX) === false) {
		throw new RuntimeException('Unable to write article source file.');
	}

	return [
		'fileName' => basename($file['path']),
		'message' => 'Saved metadata for ' . $file['fileSlug'] . '.'
	];
}

function blog_draft_find_article_file(string $slug): array {
	$contentRoot = getenv('BLOG_ARTICLE_SOURCE_ROOT');
	if ($contentRoot === false || trim((string)$contentRoot) === '') {
		$contentRoot = getcwd() . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . 'articles';
	}

	$contentRoot = rtrim((string)$contentRoot, DIRECTORY_SEPARATOR);
	if (!is_dir($contentRoot)) {
		throw new RuntimeException('Article source root is not configured on this PHP host.');
	}

	$files = glob($contentRoot . DIRECTORY_SEPARATOR . '*.md') ?: [];
	foreach ($files as $path) {
		$raw = file_get_contents($path);
		if (!is_string($raw)) continue;
		$frontmatter = blog_draft_parse_frontmatter($raw);
		$fileSlug = preg_replace('/\.md$/', '', basename($path));
		$frontmatterSlug = (string)($frontmatter['slug'] ?? '');
		if ($frontmatterSlug === $slug || $fileSlug === $slug) {
			return ['path' => $path, 'fileSlug' => $frontmatterSlug !== '' ? $frontmatterSlug : $fileSlug];
		}
	}

	throw new RuntimeException('Article source file was not found.');
}

function blog_draft_update_frontmatter(string $raw, array $updates): string {
	$normalized = preg_replace("/\r\n?/", "\n", $raw);
	if (!is_string($normalized)) $normalized = $raw;

	if (!str_starts_with($normalized, "---\n")) {
		throw new RuntimeException('Article is missing frontmatter.');
	}

	$end = strpos($normalized, "\n---", 4);
	if ($end === false) {
		throw new RuntimeException('Article frontmatter is not closed.');
	}

	$yaml = substr($normalized, 4, $end - 4);
	$body = ltrim(substr($normalized, $end + 4), "\n");
	$managed = array_flip(blog_draft_managed_keys());
	$lines = explode("\n", $yaml);
	$kept = [];
	$insertAfter = -1;

	foreach ($lines as $line) {
		if (preg_match('/^([A-Za-z0-9_-]+):/', $line, $match)) {
			$key = $match[1];
			if (isset($managed[$key])) {
				continue;
			}
		}

		$kept[] = $line;
		if (preg_match('/^(title|slug):/', $line)) {
			$insertAfter = count($kept) - 1;
		}
	}

	$insert = [];
	foreach (blog_draft_update_order() as $key) {
		if (!array_key_exists($key, $updates)) continue;
		$value = blog_draft_scalar($updates[$key]);
		if ($value === '') continue;
		$insert[] = $key . ': ' . blog_draft_yaml_quote($value);
	}

	array_splice($kept, $insertAfter + 1, 0, $insert);
	$nextYaml = implode("\n", array_values(array_filter($kept, fn($line) => trim((string)$line) !== '')));
	return "---\n" . $nextYaml . "\n---\n" . $body;
}

function blog_draft_parse_frontmatter(string $raw): array {
	$normalized = preg_replace("/\r\n?/", "\n", $raw);
	if (!is_string($normalized) || !str_starts_with($normalized, "---\n")) return [];
	$end = strpos($normalized, "\n---", 4);
	if ($end === false) return [];
	$yaml = substr($normalized, 4, $end - 4);
	$result = [];

	foreach (explode("\n", $yaml) as $line) {
		if (!preg_match('/^([A-Za-z0-9_-]+):\s*(.*)$/', $line, $match)) continue;
		$value = trim($match[2]);
		$result[$match[1]] = blog_draft_unquote($value);
	}

	return $result;
}

function blog_draft_assert_owner_token(string $token): void {
	if (trim($token) === '') {
		throw new RuntimeException('Missing Microsoft owner token.');
	}

	$url = 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName';
	$headers = "Authorization: Bearer " . $token . "\r\nAccept: application/json\r\n";
	$context = stream_context_create([
		'http' => [
			'method' => 'GET',
			'header' => $headers,
			'timeout' => 12
		]
	]);

	$response = @file_get_contents($url, false, $context);
	if (!is_string($response)) {
		throw new RuntimeException('Microsoft owner token could not be verified.');
	}

	$profile = json_decode($response, true);
	if (!is_array($profile)) {
		throw new RuntimeException('Microsoft owner profile response was invalid.');
	}

	$allowed = blog_draft_email('spice.ryan@hotmail.com');
	$mail = blog_draft_email($profile['mail'] ?? '');
	$upn = blog_draft_email($profile['userPrincipalName'] ?? '');

	if ($mail !== $allowed && $upn !== $allowed) {
		throw new RuntimeException('This Microsoft account is not allowed to edit draft metadata.');
	}
}

function blog_draft_managed_keys(): array {
	return [
		'status',
		'date',
		'updated_date',
		'publish_at',
		'release_date',
		'release_time',
		'accent',
		'design_accent',
		'image',
		'image_alt',
		'image_credit',
		'image_source',
		'image_position',
		'row_image',
		'row_image_alt',
		'row_image_credit',
		'row_image_source',
		'row_image_position',
		'background_image',
		'background_image_alt',
		'background_image_credit',
		'background_image_source',
		'background_image_position'
	];
}

function blog_draft_update_order(): array {
	return [
		'status',
		'date',
		'updated_date',
		'publish_at',
		'release_date',
		'release_time',
		'accent',
		'image',
		'image_alt',
		'image_credit',
		'image_source',
		'image_position',
		'row_image',
		'row_image_alt',
		'row_image_credit',
		'row_image_source',
		'row_image_position',
		'background_image',
		'background_image_alt',
		'background_image_credit',
		'background_image_source',
		'background_image_position'
	];
}

function blog_draft_status(string $value): string {
	$status = strtolower(trim($value));
	if ($status === 'published') return 'published';
	if ($status === 'scheduled') return 'scheduled';
	return 'draft';
}

function blog_draft_visual($value): string {
	$cleaned = blog_draft_scalar($value);
	if ($cleaned === '') return '';
	if (preg_match('/[\r\n<>]/', $cleaned)) {
		throw new RuntimeException('Visual metadata contains unsupported characters.');
	}
	return $cleaned;
}

function blog_draft_scalar($value): string {
	if (is_array($value)) {
		$value = reset($value);
	}
	return substr(trim((string)$value), 0, 1200);
}

function blog_draft_yaml_quote(string $value): string {
	return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $value) . '"';
}

function blog_draft_unquote(string $value): string {
	if ($value === '') return '';
	$first = substr($value, 0, 1);
	if (($first === '"' || $first === "'") && substr($value, -1) === $first) {
		return stripcslashes(substr($value, 1, -1));
	}
	return $value;
}

function blog_draft_today_toronto(): string {
	$zone = new DateTimeZone('America/Toronto');
	return (new DateTimeImmutable('now', $zone))->format('Y-m-d');
}

function blog_draft_email($value): string {
	return strtolower(trim((string)$value));
}
