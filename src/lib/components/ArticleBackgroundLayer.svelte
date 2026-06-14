<script lang="ts">
	type ArticleBackgroundInput = {
		slug: string;
		html: string;
		backgroundImage?: string;
	};

	type Props = {
		article: ArticleBackgroundInput;
	};

	const rawArticleModules = import.meta.glob('$lib/content/articles/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;

	let { article }: Props = $props();

	const frontmatterBackgroundImage = $derived.by(() => backgroundImageFromFrontmatter(article.slug));
	const backgroundImage = $derived.by(() => article.backgroundImage || frontmatterBackgroundImage || firstImageFromHtml(article.html));
	const backgroundStyle = $derived.by(() =>
		backgroundImage ? `--article-bg-image: url("${escapeCssUrl(backgroundImage)}")` : ''
	);

	function backgroundImageFromFrontmatter(slug: string): string {
		const raw = Object.entries(rawArticleModules).find(([path]) => path.endsWith(`/${slug}.md`))?.[1];
		if (!raw) return '';
		const match = raw.match(/^---\n([\s\S]*?)\n---/);
		if (!match) return '';
		const frontmatter = match[1];
		const field = frontmatter.match(/^(?:background_image|backgroundImage):\s*['"]?([^'"\n]+)['"]?\s*$/m);
		return sanitizeImageUrl(field?.[1] ?? '');
	}

	function firstImageFromHtml(html: string): string {
		const match = html.match(/<img\b[^>]*\bsrc=(['"])(.*?)\1/i);
		return sanitizeImageUrl(match?.[2] ?? '');
	}

	function sanitizeImageUrl(value: string): string {
		const trimmed = value.trim();
		if (!trimmed) return '';
		if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
		if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
		return '';
	}

	function escapeCssUrl(value: string): string {
		return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n|\r/g, '');
	}
</script>

{#if backgroundImage}
	<div class="article-bg-image" style={backgroundStyle} aria-hidden="true"></div>
{/if}

<style>
	.article-bg-image {
		position: fixed;
		inset: -10vmax;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		opacity: 0.105;
		filter: saturate(0.92) blur(24px);
		contain: paint;
		mask-image:
			radial-gradient(circle at 50% 10%, black 0%, black 20%, transparent 58%),
			linear-gradient(180deg, black 0%, black 32%, transparent 74%);
	}

	.article-bg-image::before,
	.article-bg-image::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.article-bg-image::before {
		background-image: var(--article-bg-image);
		background-size: cover;
		background-position: center top;
		transform: scale(1.14);
	}

	.article-bg-image::after {
		background:
			radial-gradient(circle at 50% 10%, color-mix(in srgb, var(--article-accent, var(--accent)) 18%, transparent), transparent 34%),
			linear-gradient(180deg, rgba(0, 0, 0, 0.2), #000 78%);
		mix-blend-mode: screen;
		opacity: 0.42;
	}

	:global(.article-page > :not(.article-bg-image):not(.command-bar)) {
		position: relative;
		z-index: 1;
	}

	:global(.article-page .article-shell) {
		border: 1px solid color-mix(in srgb, var(--article-accent, var(--accent)) 18%, rgba(255, 255, 255, 0.12));
		border-radius: 28px;
		padding: clamp(22px, 3vw, 42px);
		background:
			linear-gradient(135deg, rgba(21, 26, 35, 0.82), rgba(4, 6, 10, 0.66)),
			color-mix(in srgb, var(--article-accent, var(--accent)) 6%, transparent);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 22px 70px rgba(0, 0, 0, 0.26);
		backdrop-filter: blur(28px) saturate(1.18);
		-webkit-backdrop-filter: blur(28px) saturate(1.18);
	}

	:global(.article-page .hero-card),
	:global(.article-page .rail-card),
	:global(.article-page .toc),
	:global(.article-page .article-toc--mobile),
	:global(.article-page .article-references),
	:global(.article-page .related-article-card) {
		border-color: color-mix(in srgb, var(--article-accent, var(--accent)) 18%, rgba(255, 255, 255, 0.12));
		background:
			linear-gradient(135deg, rgba(24, 29, 38, 0.72), rgba(4, 6, 10, 0.52)),
			color-mix(in srgb, var(--article-accent, var(--accent)) 5%, transparent);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 18px 48px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(22px) saturate(1.14);
		-webkit-backdrop-filter: blur(22px) saturate(1.14);
	}

	:global(.article-page .meta-grid > div),
	:global(.article-page .hero-meta > div),
	:global(.article-page .status-pill),
	:global(.article-page .tag) {
		background: rgba(255, 255, 255, 0.035);
		border-color: rgba(255, 255, 255, 0.105);
		backdrop-filter: blur(16px) saturate(1.08);
		-webkit-backdrop-filter: blur(16px) saturate(1.08);
	}

	@media (max-width: 760px) {
		.article-bg-image {
			opacity: 0.055;
			filter: saturate(0.86) blur(16px);
		}

		:global(.article-page .article-shell) {
			padding: clamp(18px, 5vw, 26px);
			border-radius: 22px;
		}
	}

	@media (max-width: 760px), (prefers-reduced-transparency: reduce) {
		:global(.article-page .article-shell),
		:global(.article-page .hero-card),
		:global(.article-page .rail-card),
		:global(.article-page .toc),
		:global(.article-page .article-toc--mobile),
		:global(.article-page .article-references),
		:global(.article-page .related-article-card),
		:global(.article-page .meta-grid > div),
		:global(.article-page .hero-meta > div),
		:global(.article-page .status-pill),
		:global(.article-page .tag) {
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}
</style>
