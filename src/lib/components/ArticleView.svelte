<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articleTagIndexHref } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleCardImage, articleFocalImage } from '$lib/article-focal-images';
	import { articleHref } from '$lib/article-links';
	import { articleCanonicalUrl } from '$lib/article-surfaces';
	import {
		ARTICLE_SHARE_IMAGE_HEIGHT,
		ARTICLE_SHARE_IMAGE_WIDTH,
		articleShareImageAlt,
		articleShareImagePath
	} from '$lib/article-social-images';
	import {
		EMPTY_CO_AUTHORS,
		buildArticleFooterLinks,
		buildArticleHeaderLinks,
		buildArticleJsonLd,
		buildArticleSchemaAuthors,
		cssImageUrl,
		parseResourceLinks
	} from '$lib/article-view-model';
	import type { Article } from '$lib/articles';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { pathWithLocale } from '$lib/i18n/locales';
	import { siteConfigs, type SiteConfig } from '$lib/site-config';
	import ArticleBackgroundLayer from '$lib/components/ArticleBackgroundLayer.svelte';
	import ArticleEndMeta from '$lib/components/ArticleEndMeta.svelte';
	import ArticleResourceSections from '$lib/components/ArticleResourceSections.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import SafeHtml from '$lib/components/SafeHtml.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';

	type Props = {
		article: Article;
		relatedArticles?: Article[];
		alternates?: Array<{ hreflang: string; href: string }>;
		site?: SiteConfig;
	};

	let { article, relatedArticles = [], alternates = [], site = siteConfigs.ryan }: Props = $props();

	const articleAccent = $derived(articleAccentColor(article));
	const focalImage = $derived(articleFocalImage(article));
	const heroImage = $derived(focalImage ?? articleCardImage(article));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
	const ui = $derived(getDictionary(article.locale));
	const articleReferences = $derived(parseResourceLinks(article.references));
	const articleFurtherReading = $derived(parseResourceLinks(article.furtherReading));
	const coAuthors = $derived(article.coAuthors ?? EMPTY_CO_AUTHORS);
	const articleSchemaAuthors = $derived(buildArticleSchemaAuthors(site, coAuthors));
	const pageTitle = $derived(formatPageTitle(article.seoTitle || article.title, site.titleSuffix));
	const description = $derived(article.seoDescription || article.summary || site.description);
	const presentationOrigin = $derived(`https://${site.domain}`);
	const canonical = $derived(articleCanonicalUrl(article, presentationOrigin));
	const shareImagePath = $derived(articleShareImagePath(article, site));
	const ogImage = $derived(new URL(`${base}${shareImagePath}`, presentationOrigin).toString());
	const ogImageAlt = $derived(articleShareImageAlt(article, site));
	const localizedHomeHref = $derived(`${base}${pathWithLocale(article.locale, '/')}`);
	const localizedRssHref = $derived(`${base}${pathWithLocale(article.locale, '/rss.xml')}`);
	const localizedDevLogHref = $derived(`${base}/dev-log/`);
	const headerNavLinks = $derived(buildArticleHeaderLinks(article.design.navLinks, site));
	const articleFooterLinks = $derived(
		buildArticleFooterLinks(ui.article, localizedHomeHref, localizedRssHref, localizedDevLogHref, site, false)
	);

	const jsonLd = $derived(
		buildArticleJsonLd(
			article,
			site,
			ui.article.home,
			localizedHomeHref,
			canonical,
			description,
			articleSchemaAuthors,
			ogImage,
			ogImageAlt,
			presentationOrigin
		)
	);

	function formatPageTitle(title: string, suffix: string): string {
		const fullTitle = `${title} · ${suffix}`;
		return fullTitle.length > 65 ? title : fullTitle;
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#each alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content={site.siteName} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(ARTICLE_SHARE_IMAGE_WIDTH)} />
	<meta property="og:image:height" content={String(ARTICLE_SHARE_IMAGE_HEIGHT)} />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={ogImageAlt} />
	<meta property="article:published_time" content={article.date} />
	<meta property="article:modified_time" content={article.updatedDate} />
	{#each article.tags as tag, index (tag + ':' + index)}
		<meta property="article:tag" content={tag} />
	{/each}
</svelte:head>

<JsonLd value={jsonLd} />

	<div
		class={`article-page theme-${article.design.variant}${focalImage ? ' has-focal-image' : ''}`}
	style:--article-accent={articleAccent}
	style:--article-focal-image={focalImage ? cssImageUrl(focalImage.src) : undefined}
	style:--article-focal-position={focalImage ? focalImage.position ?? 'center center' : undefined}
>
	<ArticleBackgroundLayer {article} />
	<div class="read-progress" data-scroll-progress></div>
	<SiteHeader
		brandLabel={site.brandLabel}
		brandInitials={site.brandInitials}
		navLinks={headerNavLinks}
		showLibraryLink={site.showLibraryLinks}
		showDevLogLink={site.showDevLogLinks}
		showOwnerLinks={false}
	/>

	<section class="hero">
		{#if heroImage}
			<figure class="article-hero-visual article-hero-visual--image">
				<img
					src={heroImage.src}
					alt={heroImage.alt}
					width="1600"
					height="900"
					loading="eager"
					decoding="async"
				/>
				{#if heroImage.credit}<figcaption>{heroImage.credit}</figcaption>{/if}
			</figure>
		{/if}
		<div class="article-hero-copy" style:view-transition-name={previewTransitionName}>
			<div class="eyebrow">{article.design.eyebrow}</div>
			<h1 style:view-transition-name={titleTransitionName}>{article.title}</h1>
			<p class="article-byline">
				{site.author.name} · {ui.article.published} <time datetime={article.date}>{article.dateLabel}</time>
				{#if article.updatedDate !== article.date}
					· {ui.article.updated} <time datetime={article.updatedDate}>{article.updatedDateLabel}</time>
				{/if}
				· {article.readingMinutes} min
			</p>

			<p class="dek">{article.summary}</p>
			<div class="tag-row" aria-label={ui.article.tags}>
				{#each article.design.tags.slice(0, 3) as tag, index (tag + ':' + index)}
					<a class="tag tag-link" href={articleTagIndexHref(tag, 'published')}>{tag}</a>
				{/each}
			</div>
			{#if article.toc.length}
				<details class="toc-accordion article-toc article-toc--mobile" aria-label="Table of contents">
					<summary><span>{article.design.tocTitle}</span><strong>{article.toc.length} sections</strong></summary>
					<div class="toc-accordion-panel">
						{#each article.toc as item, index (item.id + ':' + index)}
							<a class:toc-l3={item.level === 3} class:toc-l2={item.level === 2} href={`#${item.id}`}>{item.text}</a>
						{/each}
					</div>
				</details>
			{/if}
		</div>
	</section>

	<main id="main-content" class="layout" tabindex="-1">
		<aside class="toc article-toc article-toc--desktop" aria-label="Table of contents">
			<h2>{article.design.tocTitle}</h2>
			{#each article.toc as item, index (item.id + ':' + index)}
				<a class:toc-l3={item.level === 3} class:toc-l2={item.level === 2} href={`#${item.id}`}>{item.text}</a>
			{/each}
		</aside>

		<div class="article-column">
			<article class="article-shell"><SafeHtml class="article-inner" html={article.html} /></article>

			<ArticleEndMeta {article} {coAuthors} copy={ui.article} />
			<ArticleResourceSections
				{article}
				{relatedArticles}
				{articleReferences}
				{articleFurtherReading}
				copy={ui.article}
				{site}
			/>
		</div>
	</main>

	<footer class="article-footer">
		<div class="article-footer-links" aria-label="Footer links">
			{#each articleFooterLinks as link, index (link.href + ':' + index)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</div>
	</footer>
</div>
