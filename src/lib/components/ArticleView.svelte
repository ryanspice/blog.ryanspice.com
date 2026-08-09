<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articleTagIndexHref, type ArticleIndexStatus } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleFocalImage } from '$lib/article-focal-images';
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
	import ArticleRailCard from '$lib/components/ArticleRailCard.svelte';
	import ArticleResourceSections from '$lib/components/ArticleResourceSections.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
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
	const focalImageIsDiagram = $derived(Boolean(focalImage?.src.toLowerCase().includes('.svg')));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
	const ui = $derived(getDictionary(article.locale));
	const articleInfo = $derived(`${article.draftType.replaceAll('-', ' ')} · ${ui.article.published} ${article.dateLabel}${article.updatedDate !== article.date ? ` · ${ui.article.updated} ${article.updatedDateLabel}` : ''}`);
	const articleReferences = $derived(parseResourceLinks(article.references));
	const articleFurtherReading = $derived(parseResourceLinks(article.furtherReading));
	const coAuthors = $derived(article.coAuthors ?? EMPTY_CO_AUTHORS);
	const articleSchemaAuthors = $derived(buildArticleSchemaAuthors(site, coAuthors));
	const pageTitle = $derived(formatPageTitle(article.seoTitle || article.title, site.titleSuffix));
	const description = $derived(article.seoDescription || article.summary || site.description);
	const canonical = $derived(articleCanonicalUrl(article, page.url.origin));
	const shareImagePath = $derived(articleShareImagePath(article, site));
	const ogImage = $derived(new URL(`${base}${shareImagePath}`, page.url.origin).toString());
	const ogImageAlt = $derived(articleShareImageAlt(article, site));
	const localizedHomeHref = $derived(`${base}${pathWithLocale(article.locale, '/')}`);
	const localizedRssHref = $derived(`${base}${pathWithLocale(article.locale, '/rss.xml')}`);
	const localizedDevLogHref = $derived(`${base}/dev-log/`);
	const headerNavLinks = $derived(buildArticleHeaderLinks(article.design.navLinks, site));
	const articleFooterLinks = $derived(
		buildArticleFooterLinks(ui.article, localizedHomeHref, localizedRssHref, localizedDevLogHref, site)
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
			page.url.origin
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
	class={`article-page theme-${article.design.variant} has-command-bar${focalImage ? ' has-focal-image' : ''}`}
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
		showOwnerLinks={site.showOwnerControls}
	/>

	<section class="hero">
		<div class="article-hero-visual" aria-hidden="true">
			{#if focalImage}
				<div class="article-focal-panel" class:article-focal-panel--diagram={focalImageIsDiagram}></div>
			{:else}
				<svg viewBox="0 0 420 560" focusable="false">
					<defs>
						<linearGradient id="hero-visual-line" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stop-color="currentColor" stop-opacity="0.55" />
							<stop offset="100%" stop-color="currentColor" stop-opacity="0.05" />
						</linearGradient>
						<radialGradient id="hero-visual-glow" cx="50%" cy="42%" r="58%">
							<stop offset="0%" stop-color="currentColor" stop-opacity="0.2" />
							<stop offset="100%" stop-color="currentColor" stop-opacity="0" />
						</radialGradient>
					</defs>
					<rect x="34" y="78" width="306" height="382" rx="32" fill="url(#hero-visual-glow)" />
					<g fill="none" stroke="url(#hero-visual-line)" stroke-linecap="round" stroke-linejoin="round">
						<path d="M68 402V184l112-64 128 74v218l-116 66-124-76Z" stroke-width="1.7" />
						<path d="M68 184l124 72 116-62M192 256v222" stroke-width="1.4" opacity="0.62" />
						<path d="M104 374V232l78-44 90 52v142l-82 46-86-54Z" stroke-width="1.4" opacity="0.5" />
						<path d="M132 350V260l52-30 60 35v90l-55 31-57-36Z" stroke-width="1.4" opacity="0.62" />
						<path d="M66 116h206M92 98h148M238 464h106M262 486h66" stroke-width="1.2" opacity="0.42" />
					</g>
				</svg>
			{/if}
		</div>

		<div class="article-hero-copy" style:view-transition-name={previewTransitionName}>
			<div class="eyebrow">{article.design.eyebrow}</div>
			<h1 style:view-transition-name={titleTransitionName}>{article.title}</h1>
			<p class="article-byline"><time datetime={article.date}>{article.dateLabel}</time></p>

			<dl class="meta-grid article-meta" aria-label="Article metadata">
				<div><dt>{ui.article.articleInfo}</dt><dd>{articleInfo}</dd></div>
				<div><dt>{ui.article.readTime}</dt><dd>{article.readingMinutes} min</dd></div>
				<div><dt>{ui.article.type}</dt><dd>{article.draftType.replaceAll('-', ' ')}</dd></div>
				{#if article.releaseDateLabel}
					<div><dt>{ui.article.release}</dt><dd>{article.releaseDateLabel}</dd></div>
				{/if}
			</dl>

			<p class="dek">{article.summary}</p>
			<div class="tag-row" aria-label={ui.article.tags}>
				{#each article.design.tags as tag, index (tag + ':' + index)}
					<a class="tag tag-link" href={articleTagIndexHref(tag, article.status as ArticleIndexStatus)}>{tag}</a>
				{/each}
			</div>
		</div>

		<div class="article-hero-side">
			<aside class="hero-card" aria-label={article.design.heroCardAria} style:--article-accent={articleAccent}>
				<strong>{article.design.heroCardTitle}</strong>
				<div class="status-grid">
					{#each article.design.statusItems as item, index (item.label + ':' + index)}
						<div class="status-pill"><span>{item.label}</span><strong>{item.value}</strong></div>
					{/each}
				</div>
				{#if focalImage?.credit}
					<p class="focal-credit">
						{#if focalImage.sourceHref}
							<a href={focalImage.sourceHref} rel="noreferrer" target="_blank">{focalImage.credit}</a>
						{:else}
							{focalImage.credit}
						{/if}
					</p>
				{/if}
			</aside>

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

			<ArticleRailCard {article} />
		</div>
	</section>

	<main class="layout">
		<aside class="toc article-toc article-toc--desktop" aria-label="Table of contents">
			<h2>{article.design.tocTitle}</h2>
			{#each article.toc as item, index (item.id + ':' + index)}
				<a class:toc-l3={item.level === 3} class:toc-l2={item.level === 2} href={`#${item.id}`}>{item.text}</a>
			{/each}
		</aside>

		<div class="article-column">
			<article class="article-shell"><SafeHtml class="article-inner" html={article.html} /></article>

			<ArticleEndMeta {article} {site} {coAuthors} copy={ui.article} />
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

	<div class="command-bar" aria-label="Commands">
		<div class="command-inner" data-copy-scope>
			<a class="cmd" href={localizedHomeHref} data-back-same-origin>{ui.article.back}</a>
			<a class="cmd" href={localizedRssHref}>{ui.article.rss}</a>
			<button
				class="cmd"
				type="button"
				aria-label={ui.article.copyLink}
				data-copy-text={canonical}
				data-copy-success={ui.article.linkCopied}
				data-copy-failure={ui.article.copyFailed}
			>
				{ui.article.copyLink}
			</button>
			<span class="cmd-feedback" aria-live="polite" data-copy-feedback-target hidden></span>
		</div>
	</div>

	<footer class="article-footer">
		<p class="article-footer-copy">{article.design.footerText}</p>
		<div class="article-footer-links" aria-label="Footer links">
			{#each articleFooterLinks as link, index (link.href + ':' + index)}
				<a href={link.href}>{link.label}</a>
			{/each}
			{#if site.showOwnerControls}
				<FooterAuthControls returnTo="/drafts/" />
			{/if}
		</div>
	</footer>
</div>
