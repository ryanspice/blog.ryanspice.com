<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articleTagIndexHref, type ArticleIndexStatus } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleFocalCardCssVars, articleFocalImage, articleFocalPageCssVars } from '$lib/article-focal-images';
	import { articleHref } from '$lib/article-links';
	import {
		ARTICLE_SHARE_IMAGE_HEIGHT,
		ARTICLE_SHARE_IMAGE_WIDTH,
		articleShareImageAlt,
		articleShareImagePath
	} from '$lib/article-social-images';
	import type { Article } from '$lib/articles';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { pathWithLocale } from '$lib/i18n/locales';
	import { siteConfigs, type SiteConfig } from '$lib/site-config';
	import ArticleBackgroundLayer from '$lib/components/ArticleBackgroundLayer.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
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
	const pageStyle = $derived(`--article-accent: ${articleAccent}; ${articleFocalPageCssVars(article)}`);
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));
	const ui = $derived(getDictionary(article.locale));
	const articleInfo = $derived(`${article.draftType.replaceAll('-', ' ')} · ${ui.article.published} ${article.dateLabel}${article.updatedDate !== article.date ? ` · ${ui.article.updated} ${article.updatedDateLabel}` : ''}`);
	const articleReferences = $derived(article.references.filter(Boolean));
	const pageTitle = $derived(formatPageTitle(article.seoTitle || article.title, site.titleSuffix));
	const description = $derived(article.seoDescription || article.summary || site.description);
	const canonical = $derived(new URL(articleHref(article), page.url.origin).toString());
	const shareImagePath = $derived(articleShareImagePath(article, site));
	const ogImage = $derived(new URL(`${base}${shareImagePath}`, page.url.origin).toString());
	const ogImageAlt = $derived(articleShareImageAlt(article, site));
	const localizedHomeHref = $derived(`${base}${pathWithLocale(article.locale, '/')}`);
	const localizedRssHref = $derived(`${base}${pathWithLocale(article.locale, '/rss.xml')}`);
	const localizedDevLogHref = $derived(`${base}/dev-log/`);
	const headerNavLinks = $derived.by(() =>
		site.id === 'canopy' ? [...article.design.navLinks, site.primaryExternalLink] : article.design.navLinks
	);
	const articleFooterLinks = $derived.by(() => {
		const links = [
			{ label: ui.article.home, href: localizedHomeHref },
			{ label: ui.article.rss, href: localizedRssHref }
		];
		if (site.repositoryLink) links.push({ label: site.repositoryLink.label, href: site.repositoryLink.href });
		if (site.showDevLogLinks) links.push({ label: ui.article.devLog, href: localizedDevLogHref });
		return links;
	});

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: ui.article.home,
						item: new URL(localizedHomeHref, page.url.origin).toString()
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: article.title,
						item: canonical
					}
				]
			},
			{
				'@type': 'BlogPosting',
				headline: article.title,
				description,
				mainEntityOfPage: canonical,
				datePublished: article.date,
				dateModified: article.updatedDate,
				author: {
					'@type': site.author.type,
					name: site.author.name,
					url: site.author.url
				},
				publisher: site.publisher
					? {
							'@type': site.publisher.type,
							name: site.publisher.name,
							url: site.publisher.url
						}
					: undefined,
				image: {
					'@type': 'ImageObject',
					url: ogImage,
					width: ARTICLE_SHARE_IMAGE_WIDTH,
					height: ARTICLE_SHARE_IMAGE_HEIGHT,
					caption: ogImageAlt
				},
				keywords: article.tags.join(', '),
				wordCount: article.wordCount,
				timeRequired: `PT${article.readingMinutes}M`
			}
		]
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));
	const jsonLdScriptHtml = $derived(`<script type="application/ld+json">${jsonLdEscaped}</${'script'}>`);

	function formatReferenceLabel(value: string): string {
		try {
			const url = new URL(value);
			const shortPath = url.pathname.replace(/\/$/, '');
			return `${url.hostname.replace(/^www\./, '')}${shortPath === '' || shortPath === '/' ? '' : shortPath}`;
		} catch {
			return value;
		}
	}

	function formatPageTitle(title: string, suffix: string): string {
		const fullTitle = `${title} · ${suffix}`;
		return fullTitle.length > 65 ? title : fullTitle;
	}

	async function enhanceMermaid() {
		const diagrams = Array.from(document.querySelectorAll<HTMLElement>('.mermaid-diagram'));
		if (!diagrams.length) return;

		try {
			const { default: mermaid } = await import('mermaid');
			mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'dark', darkMode: true });

			for (const [index, diagram] of diagrams.entries()) {
				const source = diagram.textContent?.trim();
				if (!source) continue;

				try {
					const renderId = `mermaid-${article.slug}-${index}`;
					const { svg } = await mermaid.render(renderId, source);
					diagram.innerHTML = svg;
					diagram.classList.add('mermaid-ready');
				} catch {
					diagram.classList.add('mermaid-error');
				}
			}
		} catch {
			for (const diagram of diagrams) diagram.classList.add('mermaid-error');
		}
	}

	onMount(() => {
		void enhanceMermaid();
	});
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
	{@html jsonLdScriptHtml}
</svelte:head>

<div class={`article-page theme-${article.design.variant} has-command-bar${focalImage ? ' has-focal-image' : ''}`} style={pageStyle}>
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
			<aside class="hero-card" aria-label={article.design.heroCardAria} style={`--article-accent: ${articleAccent}`}>
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

			<aside class="rail-card" aria-label={article.design.railTitle}>
				<h2>{article.design.railTitle}</h2>
				<p>{@html article.design.railBodyHtml}</p>
				{#if article.design.railStatusItems?.length}
					<div class="status-grid" aria-label="Publishing controls">
						{#each article.design.railStatusItems as item, index (item.label + ':' + index)}
							<div class="status-pill"><span>{item.label}</span><strong>{item.value}</strong></div>
						{/each}
					</div>
				{/if}
				{#if article.design.railPalette}
					<div class="palette-preview" aria-label={article.design.railPalette.label}>
						{#each article.design.railPalette.colors as color, index (color + ':' + index)}
							<span class="swatch" style={`background:${color}`}></span>
						{/each}
					</div>
				{/if}
				{#if article.design.railChips?.length}
					<div class="debug-stack" aria-label={article.design.railChipsLabel ?? 'Debugging stack'}>
						{#each article.design.railChips as chip, index (chip + ':' + index)}
							<span class="debug-chip">{chip}</span>
						{/each}
					</div>
				{/if}
				<div class="callout">{@html article.design.railCalloutHtml}</div>
			</aside>
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
			<article class="article-shell"><div class="article-inner">{@html article.html}</div></article>

			{#if articleReferences.length}
				<section class="article-references" aria-label={ui.article.sourcesHeading}>
					<div class="section-head section-head-with-art">
						<div class="section-head-copy">
							<p class="eyebrow">{ui.article.sources}</p>
							<h2>{ui.article.sourcesHeading}</h2>
							<p class="section-dek">{ui.article.sourcesDek}</p>
						</div>
					</div>
					<ul class="reference-list">
						{#each articleReferences as reference, index (reference + ':' + index)}
							<li><a class="wiki-link external-link" href={reference} rel="noreferrer" target="_blank">{formatReferenceLabel(reference)}</a></li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if relatedArticles.length}
				<section class="related-articles" aria-label={ui.article.related}>
					<div class="section-head">
						<p class="eyebrow">{ui.article.related}</p>
						<h2>{ui.article.relatedHeading}</h2>
						<p class="section-dek">{ui.article.relatedDek}</p>
					</div>
					<div class="related-articles-grid">
						{#each relatedArticles as related, index (related.slug + ':' + index)}
							<a class={`related-article-card article-card-link${articleFocalImage(related) ? ' has-focal-image' : ''}`} href={articleHref(related)} style={`--article-accent: ${articleAccentColor(related)}; ${articleFocalCardCssVars(related)}`}>
								{#if articleFocalImage(related)}<span class="article-card-focal" aria-hidden="true"></span>{/if}
								<div class="article-card-content">
									<p class="related-kicker">{related.draftType.replaceAll('-', ' ')}</p>
									<h3>{related.title}</h3>
									<p class="related-meta"><time datetime={related.date}>{related.dateLabel}</time><span>{related.readingMinutes} {ui.article.minRead}</span></p>
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
