<script lang="ts">
	import { articleAccentColor } from '$lib/article-accent';
	import {
		articleCardCssVars,
		articleCardImage,
		articleFocalImage
	} from '$lib/article-focal-images';
	import { articleHref } from '$lib/article-links';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';
	import type { Article } from '$lib/articles';

	type Props = {
		article: Article;
		href?: string;
	};

	let { article, href }: Props = $props();
	const articleAccent = $derived(articleAccentColor(article));
	const rowImage = $derived(articleCardImage(article));
	const focalImage = $derived(articleFocalImage(article));
	const hasRowImage = $derived(Boolean(rowImage));
	const hasFocalImage = $derived(Boolean(focalImage) && !hasRowImage);
	const cardStyle = $derived(`--article-accent: ${articleAccent}; ${articleCardCssVars(article)}`);
	const resolvedHref = $derived(href ?? articleHref(article));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
</script>

<a
	class={`article-card article-card-link${hasRowImage ? ' has-row-image' : ''}${hasFocalImage ? ' has-focal-image' : ''}`}
	href={resolvedHref}
	style={cardStyle}
	style:view-transition-name={previewTransitionName}
>
	{#if hasRowImage}
		<span class="article-card-image" aria-hidden="true"></span>
	{:else if focalImage}
		<span class="article-card-focal" aria-hidden="true"></span>
	{/if}
	<div class="article-card-content">
		<p class="card-kicker">{article.draftType.replaceAll('-', ' ')}</p>
		<h2 style:view-transition-name={titleTransitionName}>{article.title}</h2>
		<div class="card-meta" aria-label="Article metadata">
			<time datetime={article.date}>{article.dateLabel}</time>
			<span>{article.readingMinutes} min read</span>
			{#if article.releaseDateLabel}
				<span>{article.status === 'draft' ? `Releases ${article.releaseDateLabel}` : article.releaseDateLabel}</span>
			{/if}
		</div>
		<p>{article.summary}</p>
		<div class="tag-row compact" aria-label="Tags">
			{#each article.tags.slice(0, 5) as tag, index (tag + ':' + index)}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	</div>
</a>
