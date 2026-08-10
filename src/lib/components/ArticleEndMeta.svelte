<script lang="ts">
	import type { Article } from '$lib/articles';
	import { hasArticleTrustNotes } from '$lib/article-trust';

	type ArticleCopy = {
		articleDetails: string;
		published: string;
		updated: string;
		author: string;
		coAuthors: string;
	};

	type Props = {
		article: Article;
		coAuthors: NonNullable<Article['coAuthors']>;
		copy: ArticleCopy;
	};

	let { article, coAuthors, copy }: Props = $props();
	const hasTrustNotes = $derived(hasArticleTrustNotes(article));

	function isExternalHref(href: string | undefined): boolean {
		return Boolean(href && /^https?:\/\//i.test(href));
	}
</script>


{#if coAuthors.length || hasTrustNotes}
	<section class="article-end-meta" aria-label={copy.articleDetails}>
	{#if coAuthors.length}
		<dl class="article-end-meta-grid">
			<div class="article-end-meta-row--wide">
				<dt>{copy.coAuthors}</dt>
				<dd class="article-contributor-list">
					{#each coAuthors as coAuthor, index (coAuthor.name + ':' + index)}
						{#if coAuthor.href}
							<a
								href={coAuthor.href}
								rel={isExternalHref(coAuthor.href) ? 'noreferrer' : undefined}
								target={isExternalHref(coAuthor.href) ? '_blank' : undefined}
								>{coAuthor.name}</a
							>
						{:else}
							<span>{coAuthor.name}</span>
						{/if}
					{/each}
				</dd>
			</div>
		</dl>
	{/if}
	{#if hasTrustNotes}
		<div class="article-trust-notes" aria-label="Editorial trust notes">
			{#if article.lastReviewedDate && article.lastReviewedDateLabel}
				<p><strong>Last reviewed</strong> <time datetime={article.lastReviewedDate}>{article.lastReviewedDateLabel}</time></p>
			{/if}
			{#if article.disclosure}
				<p><strong>Disclosure</strong> {article.disclosure}</p>
			{/if}
			{#if article.correctionNote}
				<p><strong>Correction/update note</strong> {article.correctionNote}</p>
			{/if}
		</div>
	{/if}
	</section>
{/if}
