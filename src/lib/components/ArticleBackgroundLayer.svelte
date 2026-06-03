<script lang="ts">
	type ArticleBackgroundInput = {
		html: string;
		backgroundImage?: string;
	};

	type Props = {
		article: ArticleBackgroundInput;
	};

	let { article }: Props = $props();

	const backgroundImage = $derived.by(() => article.backgroundImage || firstImageFromHtml(article.html));
	const backgroundStyle = $derived.by(() =>
		backgroundImage ? `--article-bg-image: url("${escapeCssUrl(backgroundImage)}")` : ''
	);

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
		inset: -8vmax;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		opacity: 0.2;
		filter: saturate(1.08) blur(18px);
		mask-image:
			radial-gradient(circle at 50% 16%, black 0%, black 30%, transparent 72%),
			linear-gradient(180deg, black 0%, black 48%, transparent 88%);
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
		transform: scale(1.08);
	}

	.article-bg-image::after {
		background:
			radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--article-accent, var(--accent)) 32%, transparent), transparent 42%),
			linear-gradient(180deg, rgba(0, 0, 0, 0.12), #000 86%);
		mix-blend-mode: screen;
		opacity: 0.62;
	}

	:global(.article-page > :not(.article-bg-image)) {
		position: relative;
		z-index: 1;
	}
</style>
