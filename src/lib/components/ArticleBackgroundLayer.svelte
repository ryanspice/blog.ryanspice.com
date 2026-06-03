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
