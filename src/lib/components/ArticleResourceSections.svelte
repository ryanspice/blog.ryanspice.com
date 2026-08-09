<script lang="ts">
	import { base } from '$app/paths';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleCardImage, articleFocalImage } from '$lib/article-focal-images';
	import { articleHref } from '$lib/article-links';
	import { articleShareImagePath } from '$lib/article-social-images';
	import type { Article } from '$lib/articles';
	import type { SiteConfig } from '$lib/site-config';
	import type { ResourceLink } from '$lib/article-view-model';
	import { cssImageUrl } from '$lib/article-view-model';
	import MonetizationSlot from '$lib/components/MonetizationSlot.svelte';

	type ArticleCopy = {
		sourcesHeading: string;
		sources: string;
		sourcesDek: string;
		furtherReadingHeading: string;
		furtherReading: string;
		furtherReadingDek: string;
		related: string;
		relatedHeading: string;
		relatedDek: string;
		minRead: string;
	};

	type Props = {
		article: Article;
		relatedArticles: Article[];
		articleReferences: ResourceLink[];
		articleFurtherReading: ResourceLink[];
		copy: ArticleCopy;
		site: SiteConfig;
	};

	let { article, relatedArticles, articleReferences, articleFurtherReading, copy, site }: Props = $props();

	function articleForResourceLink(link: ResourceLink): Article | undefined {
		if (link.external) return undefined;

		const slug = slugFromHref(link.href);
		if (!slug) return undefined;

		return relatedArticles.find((candidate) => candidate.slug === slug);
	}

	function slugFromHref(href: string): string | undefined {
		try {
			const url = new URL(href, 'https://blog.ryanspice.com');
			return url.pathname.split('/').filter(Boolean).at(-1);
		} catch {
			return href.split(/[?#]/, 1)[0].split('/').filter(Boolean).at(-1);
		}
	}

	function furtherReadingCardAccent(related: Article | undefined): string | undefined {
		return related ? articleAccentColor(related) : undefined;
	}

	function furtherReadingCardImage(related: Article | undefined): string | undefined {
		if (!related) return undefined;
		const cardImage = articleCardImage(related);
		const fallbackImage = `${base}${articleShareImagePath(related, site)}`;
		return cssImageUrl(cardImage?.src ?? fallbackImage);
	}

	function furtherReadingCardPosition(related: Article | undefined): string | undefined {
		if (!related) return undefined;
		const cardImage = articleCardImage(related);
		return cardImage?.position ?? cardImage?.cardPosition ?? 'center center';
	}
</script>

{#if articleReferences.length}
	<section class="article-references" aria-label={copy.sourcesHeading}>
		<div class="section-head section-head-with-art">
			<div class="section-head-copy">
				<p class="eyebrow">{copy.sources}</p>
				<h2>{copy.sourcesHeading}</h2>
				<p class="section-dek">{copy.sourcesDek}</p>
			</div>
		</div>
		<ul class="reference-list">
			{#each articleReferences as reference, index (reference.href + ':' + index)}
				<li>
					<a
						class={`wiki-link ${reference.external ? 'external-link' : 'internal-link'}`}
						href={reference.href}
						rel={reference.external ? 'noreferrer' : undefined}
						target={reference.external ? '_blank' : undefined}
						>{reference.label}</a
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if site.monetization.position === 'article-end'}
	<MonetizationSlot slot={site.monetization} />
{/if}

{#if articleFurtherReading.length}
	<section class="article-further-reading" aria-label={copy.furtherReadingHeading}>
		<div class="section-head">
			<p class="eyebrow">{copy.furtherReading}</p>
			<h2>{copy.furtherReadingHeading}</h2>
			<p class="section-dek">{copy.furtherReadingDek}</p>
		</div>
		<ul class="reference-list reference-list--further">
			{#each articleFurtherReading as link, index (link.href + ':' + index)}
				{@const linkedArticle = articleForResourceLink(link)}
				{@const linkedImage = linkedArticle ? true : false}
				<li
					class="further-reading-card"
					class:has-further-image={Boolean(linkedImage)}
					style:--article-accent={furtherReadingCardAccent(linkedArticle)}
					style:--further-reading-image={furtherReadingCardImage(linkedArticle)}
					style:--further-reading-position={furtherReadingCardPosition(linkedArticle)}
				>
					{#if linkedImage}<span class="further-reading-card-focal" aria-hidden="true"></span>{/if}
					<a
						class={`wiki-link ${link.external ? 'external-link' : 'internal-link'}`}
						href={link.href}
						rel={link.external ? 'noreferrer' : undefined}
						target={link.external ? '_blank' : undefined}
						>{link.label}</a
					>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if relatedArticles.length}
	<section class="related-articles" aria-label={copy.related}>
		<div class="section-head">
			<p class="eyebrow">{copy.related}</p>
			<h2>{copy.relatedHeading}</h2>
			<p class="section-dek">{copy.relatedDek}</p>
		</div>
		<div class="related-articles-grid">
			{#each relatedArticles as related, index (related.slug + ':' + index)}
				{@const relatedFocalImage = articleFocalImage(related)}
				<a
					class={`related-article-card article-card-link${relatedFocalImage ? ' has-focal-image' : ''}`}
					href={articleHref(related)}
					style:--article-accent={articleAccentColor(related)}
					style:--article-focal-image={relatedFocalImage ? cssImageUrl(relatedFocalImage.src) : undefined}
					style:--article-focal-position={relatedFocalImage ? relatedFocalImage.cardPosition ?? relatedFocalImage.position ?? 'center center' : undefined}
				>
					{#if relatedFocalImage}<span class="article-card-focal" aria-hidden="true"></span>{/if}
					<div class="article-card-content">
						<p class="related-kicker">{related.draftType.replaceAll('-', ' ')}</p>
						<h3>{related.title}</h3>
						<p class="related-meta"><time datetime={related.date}>{related.dateLabel}</time><span>{related.readingMinutes} {copy.minRead}</span></p>
						<p>{related.summary}</p>
						<div class="tag-row compact" aria-label={`${related.title} tags`}>
							{#each related.tags.slice(0, 4) as tag, index (tag + ':' + index)}<span class="tag">{tag}</span>{/each}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}
