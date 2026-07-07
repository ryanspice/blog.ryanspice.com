<script lang="ts">
	import type { Article } from '$lib/articles';
	import type { SiteConfig } from '$lib/site-config';

	type ArticleCopy = {
		articleDetails: string;
		published: string;
		updated: string;
		author: string;
		coAuthors: string;
	};

	type Props = {
		article: Article;
		site: SiteConfig;
		coAuthors: NonNullable<Article['coAuthors']>;
		copy: ArticleCopy;
	};

	let { article, site, coAuthors, copy }: Props = $props();

	function isExternalHref(href: string | undefined): boolean {
		return Boolean(href && /^https?:\/\//i.test(href));
	}
</script>

<section class="article-end-meta" aria-label={copy.articleDetails}>
	<dl class="article-end-meta-grid">
		<div>
			<dt>{copy.published}</dt>
			<dd><time datetime={article.date}>{article.dateLabel}</time></dd>
		</div>
		<div>
			<dt>{copy.updated}</dt>
			<dd><time datetime={article.updatedDate}>{article.updatedDateLabel}</time></dd>
		</div>
		<div>
			<dt>{copy.author}</dt>
			<dd>
				<a href={site.author.url} rel="author noreferrer" target="_blank">{site.author.name}</a>
			</dd>
		</div>
		{#if coAuthors.length}
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
		{/if}
	</dl>
</section>
