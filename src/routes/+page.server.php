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

function blog_home_language_tag(string $locale): string {
	return $locale === 'fr' ? 'fr-CA' : 'en';
}

function blog_home_locale_prefix(string $locale): string {
	return $locale === 'fr' ? '/fr' : '';
}

function blog_home_path_with_locale(string $locale, string $path): string {
	$path = trim($path);
	if ($path === '') $path = '/';
	if (substr($path, 0, 1) !== '/') $path = '/' . $path;
	$prefix = blog_home_locale_prefix($locale);
	if ($prefix === '') return $path;
	return $path === '/' ? $prefix . '/' : $prefix . $path;
}

function blog_home_request_path(): string {
	$requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
	$path = parse_url($requestUri, PHP_URL_PATH);
	if (!is_string($path) || $path === '') return '/';

	$base = blog_home_base_path();
	if ($base !== '' && ($path === $base || str_starts_with($path, $base . '/'))) {
		$path = substr($path, strlen($base));
	}

	return $path === '' ? '/' : $path;
}

function blog_home_locale_from_request(): string {
	$path = trim(blog_home_request_path(), '/');
	$first = $path === '' ? '' : explode('/', $path)[0];
	return strtolower($first) === 'fr' ? 'fr' : 'en';
}

function blog_home_localized_alternates(string $path): array {
	return [
		[
			'locale' => 'en',
			'hreflang' => 'en',
			'href' => blog_home_url(blog_home_path_with_locale('en', $path))
		],
		[
			'locale' => 'fr',
			'hreflang' => 'fr-CA',
			'href' => blog_home_url(blog_home_path_with_locale('fr', $path))
		]
	];
}

function blog_home_dictionary(string $locale): array {
	if ($locale === 'fr') {
		return [
			'nav' => [
				'articles' => 'Articles',
				'rss' => 'RSS',
				'rssXml' => 'RSS XML',
				'devLog' => 'Journal dev',
				'library' => 'Bibliotheque',
				'briefs' => 'Briefs',
				'drafts' => 'Brouillons',
				'githubRepo' => 'Depot GitHub',
				'sitemap' => 'Plan du site',
				'readingMode' => 'Mode lecture',
				'readingOn' => 'Lecture active'
			],
			'home' => [
				'title' => 'blog.ryanspice.com · Notes techniques',
				'description' => 'Articles techniques, notes de production et journal de developpement leger de Ryan Spice.',
				'eyebrow' => 'Ryan Spice · blogue technique',
				'heading' => 'Notes pratiques sur les outils, le web, la recherche IA et les problemes Windows etranges.',
				'dek' => 'Un blogue SvelteKit prepare dans AI Wiki, avec journaux de reparation, notes de debogage, comparaisons de recherche et un journal de developpement ancre dans le vrai flux de travail.',
				'startLatest' => 'Lire le plus recent article',
				'browseLatest' => 'Voir les 5 plus recents',
				'publishedNotes' => 'Notes publiees',
				'latestUpdate' => 'Derniere mise a jour',
				'subscribe' => 'Abonnement',
				'rssFeed' => 'Flux RSS',
				'latestArticle' => 'Article le plus recent',
				'latestArticleFallback' => 'Article le plus recent',
				'recentNotesFallback' => 'Notes techniques et comparaisons recentes.',
				'published' => 'Publie',
				'readTime' => 'Temps de lecture',
				'type' => 'Type',
				'focusNote' => 'Priorite actuelle: journaux de reparation avec sources, travail web pratique et notes de recherche qui restent lisibles plus tard.',
				'quickLinks' => 'Liens rapides',
				'latestArticles' => 'Articles recents',
				'recentPosts' => 'Publications recentes',
				'recentPostsDek' => 'Les plus recentes notes techniques publiees, limitees aux 5 dernieres publications.',
				'noArticles' => 'Aucun article',
				'noArticlesHeading' => 'Aucun article publie n est disponible pour le moment.',
				'noArticlesDek' => 'Revenez apres le prochain deploiement de production.',
				'elsewhere' => 'Ailleurs',
				'linksInfo' => 'Liens et information du site',
				'footerDek' => 'Un blogue SvelteKit statique pour notes techniques, journaux de reparation, recherches et changements de site. La surface publique reste petite et facile a parcourir.',
				'posts' => 'articles',
				'staticSite' => 'Site statique'
			],
			'rss' => [
				'channelTitle' => 'Ryan Spice · Notes techniques'
			]
		];
	}

	return [
		'nav' => [
			'articles' => 'Articles',
			'rss' => 'RSS',
			'rssXml' => 'RSS XML',
			'devLog' => 'Dev log',
			'library' => 'Library',
			'briefs' => 'Briefs',
			'drafts' => 'Drafts',
			'githubRepo' => 'GitHub repo',
			'sitemap' => 'Sitemap',
			'readingMode' => 'Reading mode',
			'readingOn' => 'Reading on'
		],
		'home' => [
			'title' => 'blog.ryanspice.com · Technical notes',
			'description' => 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.',
			'eyebrow' => 'Ryan Spice · technical blog',
			'heading' => 'Practical field notes for tooling, web work, AI research, and weird Windows problems.',
			'dek' => 'A SvelteKit-first blog project staged inside the AI Wiki, with repair logs, debugging notes, research comparisons, and a lightweight dev log that stays grounded in the actual workflow.',
			'startLatest' => 'Start with the latest article',
			'browseLatest' => 'Browse the latest 5',
			'publishedNotes' => 'Published notes',
			'latestUpdate' => 'Latest update',
			'subscribe' => 'Subscribe',
			'rssFeed' => 'RSS feed',
			'latestArticle' => 'Latest article',
			'latestArticleFallback' => 'Latest article',
			'recentNotesFallback' => 'Recent technical notes and comparisons.',
			'published' => 'Published',
			'readTime' => 'Read time',
			'type' => 'Type',
			'focusNote' => 'Current focus: source-aware repair logs, practical web work, and research notes that are still readable later.',
			'quickLinks' => 'Quick links',
			'latestArticles' => 'Latest articles',
			'recentPosts' => 'Recent published posts',
			'recentPostsDek' => 'The newest published technical notes, capped to the latest 5 posts.',
			'noArticles' => 'No articles',
			'noArticlesHeading' => 'No published articles are available yet.',
			'noArticlesDek' => 'Check back after the next production deploy.',
			'elsewhere' => 'Elsewhere',
			'linksInfo' => 'Links and site info',
			'footerDek' => 'A static SvelteKit blog for technical notes, repair logs, research writeups, and a lightweight dev log for site changes. The public surface stays small and easy to scan.',
			'posts' => 'posts',
			'staticSite' => 'Static site'
		],
		'rss' => [
			'channelTitle' => 'Ryan Spice · Technical notes'
		]
	];
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

function blog_home_format_date(?string $date, string $locale = 'en'): string {
	$value = blog_home_scalar($date);
	if ($value === '') return '';

	$datetime = DateTimeImmutable::createFromFormat('Y-m-d', $value, new DateTimeZone('UTC'));
	if (!$datetime) {
		$datetime = new DateTimeImmutable($value . 'T00:00:00Z', new DateTimeZone('UTC'));
	}
	if (!$datetime) return $value;

	if ($locale === 'fr') {
		$months = [
			1 => 'janv.',
			2 => 'fevr.',
			3 => 'mars',
			4 => 'avr.',
			5 => 'mai',
			6 => 'juin',
			7 => 'juill.',
			8 => 'aout',
			9 => 'sept.',
			10 => 'oct.',
			11 => 'nov.',
			12 => 'dec.'
		];
		return $datetime->format('j') . ' ' . ($months[(int) $datetime->format('n')] ?? $datetime->format('M')) . ' ' . $datetime->format('Y');
	}

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

function blog_home_published_articles(string $locale = 'en'): array {
	$root = blog_home_content_root();
	if (!is_dir($root)) return [];

	$scanRoot = $locale === 'fr' ? $root . DIRECTORY_SEPARATOR . 'fr' : $root;
	if (!is_dir($scanRoot)) return [];

	$files = glob($scanRoot . DIRECTORY_SEPARATOR . '*.md') ?: [];
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

		$articleLocale = blog_home_scalar($frontmatter['locale'] ?? ($locale === 'fr' ? 'fr' : 'en'));
		if ($articleLocale !== $locale) continue;

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
		$dateLabel = blog_home_format_date($publishDate, $locale);
		$updatedDateLabel = blog_home_format_date($updatedDate, $locale);
		$releaseDateLabel = blog_home_format_date($releaseDate, $locale);
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
			'locale' => $locale,
			'languageTag' => blog_home_language_tag($locale),
			'translationOf' => blog_home_scalar($frontmatter['translation_of'] ?? '') ?: null,
			'translationStatus' => blog_home_scalar($frontmatter['translation_status'] ?? '') ?: null,
			'canonicalSlug' => blog_home_scalar($frontmatter['canonical_slug'] ?? $slug),
			'translations' => $locale === 'fr' ? ['en' => blog_home_scalar($frontmatter['translation_of'] ?? $slug)] : [],
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
	$words = array_values(array_filter(explode(' ', trim((string) $normalized)), fn($word) => $word !== ''));
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
			'title' => '#OpenJarvis Is the Local AI Agent Project to Watch Right Now',
			'slug' => 'openjarvis-local-ai-personal-ai-on-your-pc',
			'locale' => 'en',
			'languageTag' => 'en',
			'translationOf' => null,
			'translationStatus' => null,
			'canonicalSlug' => 'openjarvis-local-ai-personal-ai-on-your-pc',
			'translations' => [],
			'status' => 'published',
			'draftType' => 'ai-news-analysis',
			'summary' => 'OpenJarvis is trending because it reframes the personal AI assistant as a local-first, measurable, editable agent stack instead of another cloud chat wrapper. Here is what matters, what is hype, and whether it can run on a normal developer PC.',
			'tags' => ['OpenJarvis', 'local AI agent', 'open-source AI', 'AI agent framework', 'run AI locally'],
			'date' => '2026-06-04',
			'dateLabel' => 'June 4, 2026',
			'updatedDate' => '2026-06-04',
			'updatedDateLabel' => 'June 4, 2026',
			'readingMinutes' => 1,
			'design' => blog_home_design('#78d4ff', ['OpenJarvis', 'Local AI Agents', 'Personal AI', 'Ollama', 'Agent Frameworks'])
		],
		[
			'title' => 'Agent Mixing Without Theater: DeepSeek Pro, Flash, Gemma4, and the Law of Diminishing Returns',
			'slug' => 'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'locale' => 'en',
			'languageTag' => 'en',
			'translationOf' => null,
			'translationStatus' => null,
			'canonicalSlug' => 'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'translations' => [],
			'status' => 'published',
			'draftType' => 'agent-architecture',
			'summary' => 'Part 1 of a practical series on mixing DeepSeek V4 Pro, DeepSeek V4 Flash, and local Gemma4-style agents without turning a coding workflow into an expensive committee.',
			'tags' => ['deepseek', 'gemma4', 'agent orchestration', 'ai coding', 'hermes', 'model routing', 'diminishing returns'],
			'date' => '2026-06-03',
			'dateLabel' => 'June 3, 2026',
			'updatedDate' => '2026-06-04',
			'updatedDateLabel' => 'June 4, 2026',
			'readingMinutes' => 1,
			'design' => blog_home_design('#38bdf8', ['DeepSeek', 'Gemma4', 'Agent Orchestration', 'AI Coding', 'Hermes', 'Model Routing'])
		],
		[
			'title' => 'ChatGPT Deep Research vs. DeepSeek: What’s Actually Happening Under the Hood',
			'slug' => 'how-chatgpt-performs-deep-research',
			'locale' => 'en',
			'languageTag' => 'en',
			'translationOf' => null,
			'translationStatus' => null,
			'canonicalSlug' => 'how-chatgpt-performs-deep-research',
			'translations' => [],
			'status' => 'published',
			'draftType' => 'research-analysis',
			'summary' => 'A practical comparison of ChatGPT Deep Research and DeepSeek-style reasoning APIs, focused on workflow, retrieval, transparency, and what builders should actually take away.',
			'tags' => ['openai', 'chatgpt', 'deep research', 'deepseek', 'reasoning models', 'developer workflow'],
			'date' => '2026-05-30',
			'dateLabel' => 'May 30, 2026',
			'updatedDate' => '2026-05-30',
			'updatedDateLabel' => 'May 30, 2026',
			'readingMinutes' => 1,
			'design' => blog_home_design('#7c5cff', ['ChatGPT', 'Deep Research', 'DeepSeek', 'Reasoning Models', 'LLMs', 'Agentic Workflows'])
		],
		[
			'title' => 'Ship Fast, But for Windows: Adapting the Mobile App Factory Playbook to the Microsoft Store',
			'slug' => 'ship-fast-for-windows-microsoft-store-playbook',
			'locale' => 'en',
			'languageTag' => 'en',
			'translationOf' => null,
			'translationStatus' => null,
			'canonicalSlug' => 'ship-fast-for-windows-microsoft-store-playbook',
			'translations' => [],
			'status' => 'published',
			'draftType' => 'product-strategy',
			'summary' => 'A Windows-focused adaptation of the mobile app factory playbook for the Microsoft Store.',
			'tags' => ['Windows', 'Microsoft Store', 'indie apps', 'distribution', 'product strategy', 'AI'],
			'date' => '2026-05-30',
			'dateLabel' => 'May 30, 2026',
			'updatedDate' => '2026-05-30',
			'updatedDateLabel' => 'May 30, 2026',
			'readingMinutes' => 1,
			'design' => blog_home_design('#53b8ff', ['Windows', 'Microsoft Store', 'Indie Apps', 'Distribution', 'Product Strategy', 'AI'])
		],
		[
			'title' => 'Phaser vs PixiJS in 2026: Why I Chose the Rendering Library Over the Game Framework for a Water-Heavy 2.5D Seafaring Game',
			'slug' => 'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
			'locale' => 'en',
			'languageTag' => 'en',
			'translationOf' => null,
			'translationStatus' => null,
			'canonicalSlug' => 'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
			'translations' => [],
			'status' => 'published',
			'draftType' => 'technical-decision-log',
			'summary' => 'A detailed comparison of Phaser 4.1 and PixiJS 8.18 for a browser-based multiplayer roguelike sailing game with custom water rendering. Why the default choice (Phaser) turned out to be wrong for this project, and how PixiJS\'s lower-level rendering primitives map more directly to what I\'m actually building.',
			'tags' => ['Phaser', 'PixiJS', 'WebGPU', 'game engine comparison', '2.5D rendering', 'water simulation', 'multiplayer', 'Colyseus', 'indie game dev', 'technical decision'],
			'date' => '2026-05-29',
			'dateLabel' => 'May 29, 2026',
			'updatedDate' => '2026-05-29',
			'updatedDateLabel' => 'May 29, 2026',
			'readingMinutes' => 1,
			'design' => blog_home_design('#87dac4', ['Phaser', 'PixiJS', 'WebGPU', '2.5D Rendering', 'Water Simulation', 'Multiplayer', 'Colyseus', 'Indie Game Dev'])
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
	$locale = blog_home_locale_from_request();
	$homePath = blog_home_path_with_locale($locale, '/');
	$rssPath = blog_home_path_with_locale($locale, '/rss.xml');
	$publishedArticles = blog_home_published_articles($locale);
	if (!$publishedArticles && $locale === 'en') {
		$publishedArticles = blog_home_fallback_published_articles();
	}

	return [
		'locale' => $locale,
		'languageTag' => blog_home_language_tag($locale),
		'ui' => blog_home_dictionary($locale),
		'canonical' => blog_home_url($homePath),
		'alternates' => blog_home_localized_alternates('/'),
		'rssUrl' => blog_home_url($rssPath),
		'rssPath' => $rssPath,
		'homePath' => $homePath,
		'ogImage' => blog_home_url('/og-default.png'),
		'publishedArticles' => $publishedArticles,
		'recentPublishedArticles' => array_slice($publishedArticles, 0, 5),
		'publishedArticleTags' => blog_home_article_tags($publishedArticles)
	];
}
