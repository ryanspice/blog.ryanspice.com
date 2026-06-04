<?php
/**
 * PHP-side homepage load mirror.
 *
 * SvelteKit uses +page.server.ts during normal prerender/build, but the PHP adapter
 * can only re-run PHP load functions when it rebuilds hydration data for production.
 * This parser-backed mirror keeps the runtime payload aligned with markdown frontmatter.
 */

declare(strict_types=1);

function blog_home_base_path(): string {
	$base = '';
	if (defined('SK_BASE_PATH')) {
		$base = (string) SK_BASE_PATH;
	} else {
		$envBase = getenv('SK_BASE_PATH');
		$base = $envBase === false ? '' : (string) $envBase;
	}

	$base = trim($base);
	if ($base === '' || $base === '/' || $base === '.') return '';
	if (substr($base, 0, 1) !== '/') $base = '/' . $base;
	return rtrim($base, '/');
}

function blog_home_origin(): string {
	$host = $_SERVER['HTTP_HOST'] ?? 'blog.ryanspice.com';
	$https = $_SERVER['HTTPS'] ?? '';
	$forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
	$scheme = ($https === 'on' || $https === '1' || strtolower((string) $forwardedProto) === 'https') ? 'https' : 'http';
	return $scheme . '://' . $host;
}

function blog_home_url(string $path): string {
	$path = trim($path);
	if ($path === '') $path = '/';
	if (substr($path, 0, 1) !== '/') $path = '/' . $path;
	return blog_home_origin() . blog_home_base_path() . $path;
}

function blog_home_design(string $accent, array $tags): array {
	return [
		'accent' => $accent,
		'tags' => $tags
	];
}

function blog_home_article_tags(array $articles): array {
	$seen = [];
	foreach ($articles as $article) {
		foreach (($article['tags'] ?? []) as $tag) {
			$seen[(string) $tag] = true;
		}
	}

	$tags = array_keys($seen);
	sort($tags, SORT_NATURAL | SORT_FLAG_CASE);
	return $tags;
}

function blog_home_content_root(): string {
	$contentRoot = getenv('BLOG_ARTICLE_SOURCE_ROOT');
	if ($contentRoot === false || trim((string) $contentRoot) === '') {
		$contentRoot = getcwd() . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . 'articles';
	}
	return rtrim((string) $contentRoot, DIRECTORY_SEPARATOR);
}

function blog_home_is_scalar($value): bool {
	return $value !== null && !is_array($value);
}

function blog_home_scalar($value): string {
	if (is_array($value)) {
		$value = reset($value);
	}
	$clean = trim((string) $value);
	return mb_substr($clean, 0, 3000);
}

function blog_home_parse_list($value): array {
	if (is_array($value)) {
		return array_values(array_map('strval', $value));
	}

	if (!is_string($value)) return [];

	$value = trim($value);
	if ($value === '') return [];
	return [trim($value)];
}

function blog_home_unquote(string $value): string {
	if ($value === '') return '';
	$first = substr($value, 0, 1);
	if (($first === '"' || $first === "'") && substr($value, -1) === $first) {
		return stripcslashes(substr($value, 1, -1));
	}
	return $value;
}

function blog_home_parse_frontmatter(string $raw): array {
	$normalized = preg_replace("/\r\n?/", "\n", $raw);
	if (!is_string($normalized) || !str_starts_with($normalized, "---\n")) return [];
	$end = strpos($normalized, "\n---", 4);
	if ($end === false) return [];

	$yaml = substr($normalized, 4, $end - 4);
	$result = [];
	$activeKey = null;

	foreach (explode("\n", $yaml) as $line) {
		if (preg_match('/^\s+-\s+(.*)$/', $line, $match) && $activeKey !== null) {
			$current = $result[$activeKey] ?? [];
			if (!is_array($current)) $current = [];
			$current[] = blog_home_unquote(trim($match[1]));
			$result[$activeKey] = $current;
			continue;
		}

		if (preg_match('/^([A-Za-z0-9_-]+):\s*(.*)$/', $line, $match)) {
			$key = $match[1];
			$value = trim($match[2]);
			$result[$key] = $value === '' ? [] : blog_home_unquote($value);
			$activeKey = $key;
		}
	}

	return $result;
}

function blog_home_extract_body(string $raw): string {
	$normalized = preg_replace("/\r\n?/", "\n", $raw);
	if (!is_string($normalized) || !str_starts_with($normalized, "---\n")) return $normalized;
	$end = strpos($normalized, "\n---", 4);
	if ($end === false) return '';
	return ltrim(substr($normalized, $end + 4), "\n");
}

function blog_home_format_date(?string $date): string {
	$value = blog_home_scalar($date);
	if ($value === '') return '';

	$datetime = DateTimeImmutable::createFromFormat('Y-m-d', $value, new DateTimeZone('UTC'));
	if (!$datetime) {
		$datetime = new DateTimeImmutable($value . 'T00:00:00Z', new DateTimeZone('UTC'));
	}
	if (!$datetime) return $value;

	return $datetime->format('M j, Y');
}

function blog_home_is_date_reached(string $date, DateTimeImmutable $now): bool {
	$parsed = DateTimeImmutable::createFromFormat('Y-m-d', $date, new DateTimeZone('America/Toronto'));
	if (!$parsed) return false;
	return $parsed <= $now->setTime(0, 0, 0);
}

function blog_home_status(string $status): string {
	$value = strtolower(trim($status));
	if ($value === 'published') return 'published';
	if ($value === 'scheduled') return 'scheduled';
	return 'draft';
}

function blog_home_slug_from_frontmatter(array $frontmatter, string $path): string {
	$frontmatterSlug = blog_home_scalar($frontmatter['slug'] ?? '');
	if ($frontmatterSlug !== '') return $frontmatterSlug;
	return preg_replace('/\.md$/i', '', basename($path));
}

function blog_home_title_from_frontmatter(array $frontmatter, string $body, string $path): string {
	$title = blog_home_scalar($frontmatter['title'] ?? '');
	if ($title !== '') return $title;

	$match = [];
	if (preg_match('/^#\s+(.+)$/m', $body, $match)) {
		return trim($match[1]);
	}

	return preg_replace('/\.md$/i', '', basename($path));
}

function blog_home_published_articles(): array {
	$root = blog_home_content_root();
	if (!is_dir($root)) return [];

	$files = glob($root . DIRECTORY_SEPARATOR . '*.md') ?: [];
	if (!$files) return [];

	$accents = [
		'gimp-3-repair-photogimp-pixelboats-workstation' => '#f2d27c',
		'debugging-gimp-3-python-plugin-failures-windows-windhawk' => '#ffcf77',
		'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game' => '#87dac4',
		'how-chatgpt-performs-deep-research' => '#7c5cff',
		'ship-fast-for-windows-microsoft-store-playbook' => '#53b8ff',
		'hermes-deepseek-setup' => '#1e9bff',
		'what-can-you-actually-do-with-a-deepseek-api-key' => '#ff00ff',
		'ingesting-voxel-engine-optimisations-ai-wiki-pixelboats' => '#b87936',
		'pixelboats-water-pipeline-pixi-webgl' => '#0078d4',
		'pixelboats-networking-final-recommendation' => '#87dac4',
		'pixelboats-networking-player-hosted-php' => '#00c2ff',
		'openjarvis-local-ai-personal-ai-on-your-pc' => '#78d4ff'
	];

	$parsedArticles = [];
	$zone = new DateTimeZone('America/Toronto');
	$now = new DateTimeImmutable('now', $zone);

	foreach ($files as $path) {
		$raw = file_get_contents($path);
		if (!is_string($raw)) continue;

		$frontmatter = blog_home_parse_frontmatter($raw);
		$body = blog_home_extract_body($raw);

		if (empty($frontmatter)) continue;

		$status = blog_home_status(blog_home_scalar($frontmatter['status'] ?? 'draft'));
		$releaseDate = blog_home_scalar($frontmatter['release_date'] ?? '');
		$dateValue = blog_home_scalar($frontmatter['date'] ?? '');
		if ($dateValue === '') {
			$filename = basename($path);
			if (preg_match('/^\d{4}-\d{2}-\d{2}/', $filename, $dateMatch)) {
				$dateValue = $dateMatch[0];
			}
		}

		if ($status !== 'published' && !($releaseDate && blog_home_is_date_reached($releaseDate, $now))) {
			continue;
		}

		$publishDate = $releaseDate !== '' ? $releaseDate : $dateValue;
		if ($publishDate === '') continue;

		$slug = blog_home_slug_from_frontmatter($frontmatter, $path);
		$title = blog_home_title_from_frontmatter($frontmatter, $body, $path);
		$summary = blog_home_scalar($frontmatter['summary'] ?? '');
		$draftType = blog_home_scalar($frontmatter['draft_type'] ?? 'technical-blog-post');
		$tags = blog_home_parse_list($frontmatter['tags'] ?? []);
		$updatedDate = blog_home_scalar($frontmatter['updated_date'] ?? $frontmatter['modified_date'] ?? $dateValue);
		$dateLabel = blog_home_format_date($publishDate);
		$updatedDateLabel = blog_home_format_date($updatedDate);
		$releaseDateLabel = blog_home_format_date($releaseDate);
		$readingMinutes = blog_home_reading_minutes($body, $summary);
		$accent = blog_home_scalar($frontmatter['accent'] ?: $frontmatter['design_accent'] ?? '');
		if (!preg_match('/^#[0-9a-fA-F]{6}$/', $accent)) {
			$accent = $accents[$slug] ?? '#1e9bff';
		}

		$visuals = [];
		foreach (['row', 'image', 'background'] as $key) {
			$visual = blog_home_parse_visual($frontmatter, $key);
			if (!$visual) continue;
			$visuals[$key === 'image' ? 'focal' : $key] = $visual;
		}

		$parsedArticles[] = [
			'title' => $title,
			'slug' => $slug,
			'status' => $status,
			'draftType' => $draftType,
			'summary' => $summary,
			'tags' => array_values(array_unique($tags)),
			'date' => $publishDate,
			'dateLabel' => $dateLabel,
			'updatedDate' => $updatedDate ?: $publishDate,
			'updatedDateLabel' => $updatedDateLabel ?: $dateLabel,
			'releaseDate' => $releaseDate ?: null,
			'releaseDateLabel' => $releaseDateLabel,
			'readingMinutes' => $readingMinutes,
			'design' => blog_home_design($accent, array_slice($tags, 0, 10)),
			'visuals' => $visuals
		];
	}

	if (count($parsedArticles) === 0) {
		return [];
	}

	usort($parsedArticles, function (array $left, array $right): int {
		$leftDate = $left['releaseDate'] ?: $left['date'];
		$rightDate = $right['releaseDate'] ?: $right['date'];
		if ($leftDate === $rightDate) {
			return strcasecmp($right['title'], $left['title']);
		}
		return strcmp($rightDate, $leftDate);
	});

	return array_slice($parsedArticles, 0, 5);
}

function blog_home_reading_minutes(string $body, string $summary): int {
	$source = $summary ?: $body;
	$normalized = preg_replace('/[#>*`\[\]\(\)]/', ' ', $source);
	$normalized = preg_replace('/\s+/', ' ', html_entity_decode(strip_tags($normalized), ENT_QUOTES, 'UTF-8') ?? '');
	$words = array_values(array_filter(explode(' ', trim((string) $normalized)), fn($word) => $word !== '');
	return max(1, (int) ceil(count($words) / 220));
}

function blog_home_parse_visual(array $frontmatter, string $key): array {
	$sourceKey = $key === 'image' ? 'image' : "{$key}_image";
	$src = blog_home_scalar($frontmatter[$sourceKey] ?? '');
	if ($src === '') return [];
	return [
		'src' => $src,
		'alt' => blog_home_scalar($frontmatter["{$sourceKey}_alt"] ?? 'Article visual image'),
		'credit' => blog_home_scalar($frontmatter["{$sourceKey}_credit"] ?? ''),
		'sourceHref' => blog_home_scalar($frontmatter["{$sourceKey}_source"] ?? ''),
		'position' => blog_home_scalar($frontmatter["{$sourceKey}_position"] ?? '')
	];
}

function blog_home_fallback_published_articles(): array {
	return [
		[
			'title' => 'Agent Mixing Without Theater: DeepSeek Pro, Flash, Gemma4, and the Law of Diminishing Returns',
			'slug' => 'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'status' => 'published',
			'draftType' => 'agent-architecture',
			'summary' => 'Part 1 of a practical series on mixing DeepSeek V4 Pro, DeepSeek V4 Flash, and local Gemma4-style agents without turning a coding workflow into an expensive committee.',
			'tags' => ['deepseek', 'gemma4', 'agent orchestration', 'ai coding', 'hermes', 'model routing', 'diminishing returns'],
			'date' => '2026-06-03',
			'dateLabel' => 'June 3, 2026',
			'updatedDate' => '2026-06-04',
			'updatedDateLabel' => 'June 4, 2026',
			'readingMinutes' => 11,
			'design' => blog_home_design('#38bdf8', ['DeepSeek', 'Gemma4', 'Agent Orchestration', 'AI Coding', 'Hermes', 'Model Routing'])
		],
		[
			'title' => 'ChatGPT Deep Research vs. DeepSeek: What’s Actually Happening Under the Hood',
			'slug' => 'how-chatgpt-performs-deep-research',
			'status' => 'published',
			'draftType' => 'research-analysis',
			'summary' => 'A practical comparison of ChatGPT Deep Research and DeepSeek-style reasoning APIs, focused on workflow, retrieval, transparency, and what builders should actually take away.',
			'tags' => ['openai', 'chatgpt', 'deep research', 'deepseek', 'reasoning models', 'developer workflow'],
			'date' => '2026-05-30',
			'dateLabel' => 'May 30, 2026',
			'updatedDate' => '2026-05-30',
			'updatedDateLabel' => 'May 30, 2026',
			'readingMinutes' => 5,
			'design' => blog_home_design('#7c5cff', ['ChatGPT', 'Deep Research', 'DeepSeek', 'Reasoning Models', 'LLMs', 'Agentic Workflows'])
		],
		[
			'title' => 'Ship Fast, But for Windows: Adapting the Mobile App Factory Playbook to the Microsoft Store',
			'slug' => 'ship-fast-for-windows-microsoft-store-playbook',
			'status' => 'published',
			'draftType' => 'product-strategy',
			'summary' => 'A Windows-focused adaptation of the mobile app factory playbook for the Microsoft Store.',
			'tags' => ['Windows', 'Microsoft Store', 'indie apps', 'distribution', 'product strategy', 'AI'],
			'date' => '2026-05-30',
			'dateLabel' => 'May 30, 2026',
			'updatedDate' => '2026-05-30',
			'updatedDateLabel' => 'May 30, 2026',
			'readingMinutes' => 6,
			'design' => blog_home_design('#53b8ff', ['Windows', 'Microsoft Store', 'Indie Apps', 'Distribution', 'Product Strategy', 'AI'])
		],
		[
			'title' => 'Phaser vs PixiJS in 2026: Why I Chose the Rendering Library Over the Game Framework for a Water-Heavy 2.5D Seafaring Game',
			'slug' => 'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
			'status' => 'published',
			'draftType' => 'technical-decision-log',
			'summary' => 'A detailed comparison of Phaser 4.1 and PixiJS 8.18 for a browser-based multiplayer roguelike sailing game with custom water rendering. Why the default choice (Phaser) turned out to be wrong for this project, and how PixiJS\'s lower-level rendering primitives map more directly to what I\'m actually building.',
			'tags' => ['Phaser', 'PixiJS', 'WebGPU', 'game engine comparison', '2.5D rendering', 'water simulation', 'multiplayer', 'Colyseus', 'indie game dev', 'technical decision'],
			'date' => '2026-05-29',
			'dateLabel' => 'May 29, 2026',
			'updatedDate' => '2026-05-29',
			'updatedDateLabel' => 'May 29, 2026',
			'readingMinutes' => 8,
			'design' => blog_home_design('#87dac4', ['Phaser', 'PixiJS', 'WebGPU', '2.5D Rendering', 'Water Simulation', 'Multiplayer', 'Colyseus', 'Indie Game Dev'])
		],
		[
			'title' => 'Debugging GIMP 3 Python Plug-in Failures on Windows: When the Culprit Wasn’t GIMP',
			'slug' => 'debugging-gimp-3-python-plugin-failures-windows-windhawk',
			'status' => 'published',
			'draftType' => 'technical-blog-post',
			'summary' => 'A companion debugging article about GIMP 3 Python plugin failures on Windows, the misleading libgraphite2/_Unwind_Resume symptom, Pango/GI failures, PATH/DLL pollution, and the Windhawk hook layer.',
			'tags' => ['gimp', 'gimp-3', 'windows-11', 'windhawk', 'python-plugins', 'pango', 'dll-debugging', 'desktop-tooling', 'troubleshooting', 'pixelboats'],
			'date' => '2026-05-28',
			'dateLabel' => 'May 28, 2026',
			'updatedDate' => '2026-05-28',
			'updatedDateLabel' => 'May 28, 2026',
			'readingMinutes' => 5,
			'design' => blog_home_design('#ffcf77', ['GIMP', 'GIMP 3', 'Windows 11', 'Windhawk', 'DLL Debugging', 'Python', 'Troubleshooting'])
		]
	];
}

function blog_home_is_published(array $frontmatter, DateTimeImmutable $now): bool {
	$status = blog_home_status(blog_home_scalar($frontmatter['status'] ?? 'draft'));
	if ($status === 'published') return true;

	$releaseDate = blog_home_scalar($frontmatter['release_date'] ?? '');
	if ($releaseDate === '') return false;
	return blog_home_is_date_reached($releaseDate, $now);
}

function load($event): array {
	$publishedArticles = blog_home_published_articles();
	if (!$publishedArticles) {
		$publishedArticles = blog_home_fallback_published_articles();
	}

	return [
		'canonical' => blog_home_url('/'),
		'rssUrl' => blog_home_url('/rss.xml'),
		'ogImage' => blog_home_url('/og-default.png'),
		'publishedArticles' => $publishedArticles,
		'publishedArticleTags' => blog_home_article_tags($publishedArticles)
	];
}
