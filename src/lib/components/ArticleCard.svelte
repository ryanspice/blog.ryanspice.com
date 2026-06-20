<script lang="ts">
	import { articleAccentColor } from '$lib/article-accent';
	import { articleSearchText, articleTagIndexHref, type ArticleIndexStatus } from '$lib/article-browse';
	import {
		articleCardCssVars,
		articleCardImage,
		articleFocalImage
	} from '$lib/article-focal-images';
	import { articleHref } from '$lib/article-links';
	import { articleSocialShareHref } from '$lib/article-share';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';
	import type { Article } from '$lib/articles';
	import { getDictionary } from '$lib/i18n/dictionaries';

	type Props = {
		article: Article;
		href?: string;
		shareUrl?: string;
	};

	let { article, href, shareUrl }: Props = $props();
	const articleAccent = $derived(articleAccentColor(article));
	const rowImage = $derived(articleCardImage(article));
	const focalImage = $derived(articleFocalImage(article));
	const hasRowImage = $derived(Boolean(rowImage));
	const hasFocalImage = $derived(Boolean(focalImage) && !hasRowImage);
	const cardStyle = $derived(`--article-accent: ${articleAccent}; ${articleCardCssVars(article)}`);
	const resolvedHref = $derived(href ?? articleHref(article));
	const tagIndexStatus = $derived<ArticleIndexStatus>(article.status === 'published' ? 'published' : 'draft');
	const cardSearchText = $derived(articleSearchText(article));
	const cardTags = $derived(article.tags.join('|'));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
	const ui = $derived(getDictionary(article.locale).article);
	const shareTargetUrl = $derived(shareUrl?.trim() || resolvedHref);
	const canSocialShare = $derived(article.status === 'published' && /^https?:\/\//i.test(shareTargetUrl));
	const facebookShareHref = $derived(articleSocialShareHref('facebook', shareTargetUrl, article.title));
	const xShareHref = $derived(articleSocialShareHref('x', shareTargetUrl, article.title));
	const linkedInShareHref = $derived(articleSocialShareHref('linkedin', shareTargetUrl, article.title));
</script>

<article
	class={`article-card article-card-link${hasRowImage ? ' has-row-image' : ''}${hasFocalImage ? ' has-focal-image' : ''}`}
	data-article-card
	data-article-search={cardSearchText}
	data-article-tags={cardTags}
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
		<h2 style:view-transition-name={titleTransitionName}>
			<a class="article-title-link" href={resolvedHref}>{article.title}</a>
		</h2>
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
				<a class="tag tag-link" href={articleTagIndexHref(tag, tagIndexStatus)}>{tag}</a>
			{/each}
		</div>
		<div class="article-card-actions" aria-label={ui.articleActions} data-copy-scope>
			<a
				class="article-card-action article-card-action--primary"
				href={resolvedHref}
				target="_blank"
				rel="noreferrer"
				aria-label={`${ui.openArticle}: ${article.title}`}
				>{ui.openArticle}</a
			>
			<button
				class="article-card-action"
				type="button"
				aria-label={`${ui.copyLink}: ${article.title}`}
				data-copy-text={shareTargetUrl}
				data-copy-success={ui.linkCopied}
				data-copy-failure={ui.copyFailed}
			>
				{ui.copyLink}
			</button>
			{#if canSocialShare}
				<button
					class="article-card-action"
					type="button"
					aria-label={`${ui.shareArticle}: ${article.title}`}
					data-share-url={shareTargetUrl}
					data-share-title={article.title}
					data-share-text={article.summary}
					data-share-success={ui.shareOpened}
					data-copy-success={ui.linkCopied}
					data-copy-failure={ui.copyFailed}
				>
					{ui.shareArticle}
				</button>
				<a
					class="article-card-action article-card-action--social"
					href={facebookShareHref}
					target="_blank"
					rel="noreferrer"
					aria-label={`${ui.shareFacebook}: ${article.title}`}
					>{ui.shareFacebook}</a
				>
				<details class="article-card-share-menu">
					<summary class="article-card-action">{ui.moreShareActions}</summary>
					<div class="article-card-share-list">
						<a href={xShareHref} target="_blank" rel="noreferrer" aria-label={`${ui.shareX}: ${article.title}`}>{ui.shareX}</a>
						<a href={linkedInShareHref} target="_blank" rel="noreferrer" aria-label={`${ui.shareLinkedIn}: ${article.title}`}>{ui.shareLinkedIn}</a>
					</div>
				</details>
			{/if}
			<span class="article-card-action-feedback" aria-live="polite" data-copy-feedback-target hidden></span>
		</div>
	</div>
</article>
