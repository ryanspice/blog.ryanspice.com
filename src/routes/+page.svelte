<script lang="ts">
	import { base } from '$app/paths';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleCardImage, articleFocalImage } from '$lib/article-focal-images';
	import type { Article } from '$lib/articles';
	import { articleHref } from '$lib/article-links';
	import {
		buildAssuranceCards,
		buildHomeJsonLd,
		cssImageUrl,
		externalHeaderLinks,
		firstArticles,
		normalizeArticles,
		normalizeTags
	} from '$lib/home-page-model';
	import ArticleIcon from '$lib/components/ArticleIcon.svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import HomeFandangoStyles from '$lib/components/HomeFandangoStyles.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { PUBLIC_ARTICLE_LABELS } from '$lib/public-taxonomy';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const publishedArticles = $derived(normalizeArticles(data.publishedArticles));
	const site = $derived(data.site);
	const copy = $derived(data.ui.home);
	const navCopy = $derived(data.ui.nav);
	const latestArticles = $derived(data.archiveMode ? publishedArticles : firstArticles(publishedArticles));
	const articleTags = $derived(normalizeTags(data.publishedArticleTags));
	const archiveHref = $derived(`${data.locale === 'fr' ? '/fr' : ''}/archive/#articles`);
	const articleFilterAction = $derived(`${base}${data.homePath}#articles`);
	const articleResetHref = $derived(`${base}${data.homePath}#articles`);

	const title = $derived(copy.title);
	const description = $derived(copy.description);
	const latestArticle = $derived.by(() => latestArticles[0] ?? null);
	const latestArticleVisual = $derived.by(() => articleCardImage(latestArticle));
	const latestArticleFocal = $derived.by(() => articleFocalImage(latestArticle));
	const latestDate = $derived.by(() => (latestArticle ? latestArticle.date : '2026-05-28'));
	const latestDateLabel = $derived.by(() => (latestArticle ? latestArticle.dateLabel : 'May 28, 2026'));
	const latestArticleHref = $derived.by(() => (latestArticle ? articleHref(latestArticle) : `${base}${data.homePath}#articles`));
	const latestArticleAccent = $derived.by(() => (latestArticle ? articleAccentColor(latestArticle) : 'var(--accent)'));
	const canonical = $derived(data.canonical);
	const ogImage = $derived(data.ogImage);
	const footerExternalLinks = $derived(site.footerExternalLinks);
	const headerExternalLinks = $derived(externalHeaderLinks(site));
	const homeJsonLd = $derived.by(() => buildHomeJsonLd(site.id, data.locale));
	const assuranceCards = $derived(buildAssuranceCards(copy, latestDateLabel, latestArticleHref, data.rssReaderPath, publishedArticles.length));

	function articleShareUrl(article: Article): string {
		return new URL(articleHref(article), canonical).toString();
	}

</script>

<HomeFandangoStyles />
<JsonLd value={homeJsonLd} />

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#each data.alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.siteName} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={title} />
</svelte:head>

<SiteHeader
	brandLabel={site.brandLabel}
	brandInitials={site.brandInitials}
	showLibraryLink={site.showLibraryLinks}
	showDevLogLink={site.showDevLogLinks}
	showOwnerLinks={site.showOwnerControls}
	navLinks={[
			{ label: navCopy.articles, href: archiveHref },
		{ label: navCopy.rss, href: data.rssPath },
		...headerExternalLinks
	]}
/>

<main id="main-content" tabindex="-1">
<section class="home-hero" style:--article-accent={latestArticleAccent}>
	<div class="home-hero-copy">
		<p class="eyebrow">{copy.eyebrow}</p>
		<h1>{copy.heading}</h1>
		<p class="dek">{copy.dek}</p>
		<div class="home-primary-actions" aria-label="Primary actions">
			<a href={latestArticleHref}>{copy.startLatest}</a>
			<a href={archiveHref}>{copy.browseLatest}</a>
		</div>
		<dl class="meta-grid home-meta" aria-label="Site metadata">
			<div>
				<dt><ArticleIcon name="articles" class="meta-icon" /><span>{copy.publishedNotes}</span></dt>
				<dd>{publishedArticles.length}</dd>
			</div>
			<div>
				<dt><ArticleIcon name="latest" class="meta-icon" /><span>{copy.latestUpdate}</span></dt>
				<dd><time datetime={latestDate}>{latestDateLabel}</time></dd>
			</div>
			<div>
				<dt><ArticleIcon name="feed" class="meta-icon" /><span>{copy.subscribe}</span></dt>
				<dd><a href={data.rssUrl}>{copy.rssFeed}</a></dd>
			</div>
		</dl>
	</div>

	<aside
		class={`hero-card home-hero-card${latestArticleVisual ? ' has-row-image' : ''}`}
		aria-label="Latest article"
		style:--article-accent={latestArticleAccent}
		style:--article-row-image={latestArticleVisual ? cssImageUrl(latestArticleVisual.src) : undefined}
		style:--article-row-position={latestArticleVisual ? latestArticleVisual.position ?? latestArticleVisual.cardPosition ?? 'center center' : undefined}
		style:--article-focal-image={!latestArticleVisual && latestArticleFocal ? cssImageUrl(latestArticleFocal.src) : undefined}
		style:--article-focal-position={!latestArticleVisual && latestArticleFocal ? latestArticleFocal.cardPosition ?? latestArticleFocal.position ?? 'center center' : undefined}
	>
		{#if latestArticleVisual}
			<span class="article-card-image" aria-hidden="true"></span>
		{:else if latestArticleFocal}
			<span class="article-card-focal" aria-hidden="true"></span>
		{/if}
		<div class="article-card-content">
			<strong>{copy.latestArticle}</strong>
			<h2><a href={latestArticleHref}>{latestArticle?.title ?? copy.latestArticleFallback}</a></h2>
			<p>{latestArticle?.summary ?? copy.recentNotesFallback}</p>
			<dl class="hero-meta" aria-label="Latest article metadata">
				<div><dt>{copy.published}</dt><dd><time datetime={latestDate}>{latestDateLabel}</time></dd></div>
				<div><dt>{copy.readTime}</dt><dd>{latestArticle?.readingMinutes ?? 0} min</dd></div>
				<div><dt>{copy.type}</dt><dd>{latestArticle ? PUBLIC_ARTICLE_LABELS[latestArticle.publicType] : 'article'}</dd></div>
			</dl>
			<p class="home-hero-note">{copy.focusNote}</p>
			<div class="home-hero-links" aria-label={copy.quickLinks}>
				<a href={data.rssUrl}>{copy.rssFeed}</a>
				<a href={data.rssReaderPath}>{copy.rssFeed}</a>
			</div>
		</div>
	</aside>
</section>

<section class="home-assurance" aria-labelledby="home-assurance-heading">
	<div class="home-assurance-copy">
		<p class="eyebrow">{copy.quickLinks}</p>
		<h2 id="home-assurance-heading">{copy.assuranceHeading}</h2>
		<p>{copy.assuranceDek}</p>
	</div>
	<div class="home-assurance-grid">
		{#each assuranceCards as card, index (card.label + ':' + index)}
			{#if card.href}
				<a class="home-assurance-card" href={card.href}>
					<span>{card.label}</span>
					<strong>{card.value}</strong>
					<small>{card.text}</small>
				</a>
			{:else}
				<div class="home-assurance-card">
					<span>{card.label}</span>
					<strong>{card.value}</strong>
					<small>{card.text}</small>
				</div>
			{/if}
		{/each}
	</div>
</section>

<section id="articles" class="article-grid home-article-grid" aria-label="Latest published articles" data-article-index>
	<div class="section-head">
		<p class="eyebrow">{copy.latestArticles}</p>
		<h2>{copy.recentPosts}</h2>
		<p class="section-dek">{copy.recentPostsDek}</p>
	</div>

	<form class="article-filter-bar" method="get" action={articleFilterAction} aria-label={copy.articleSearch} data-article-filter-form>
		<input type="hidden" name="view" value="compact" />
		<label class="filter-field">
			<span>{copy.articleSearch}</span>
			<input type="text" name="q" placeholder={copy.articleSearchPlaceholder} data-article-filter-query />
		</label>
		<label class="filter-field">
			<span>{copy.articleTagFilter}</span>
			<select name="tag" data-article-filter-tag>
				<option value="">{copy.allTags}</option>
				{#each articleTags as tag, index (tag + ':' + index)}
					<option value={tag}>{tag}</option>
				{/each}
			</select>
		</label>
		<div class="filter-actions">
			<button type="submit">{copy.search}</button>
			<a class="home-filter-link" href={articleResetHref}>{copy.resetFilters}</a>
		</div>
	</form>

	<p class="article-results-meta" data-article-results-meta data-results-label={copy.matchingArticles} hidden></p>

	{#if publishedArticles.length}
				{#each latestArticles as article, index (article.slug + ':' + index)}
			<ArticleCard article={article} shareUrl={articleShareUrl(article)} />
		{/each}
	{:else}
		<div class="article-empty">
			<p class="eyebrow">{copy.noArticles}</p>
			<h2>{copy.noArticlesHeading}</h2>
			<p class="section-dek">{copy.noArticlesDek}</p>
		</div>
	{/if}
</section>

<footer class="site-footer" aria-label="Site footer">
	<div class="site-footer-grid">
		<div class="site-footer-copy">
			<p class="eyebrow">{copy.elsewhere}</p>
			<h2>{copy.linksInfo}</h2>
			<p class="site-footer-dek">{copy.footerDek}</p>
		</div>

		<div class="site-footer-links">
			{#each footerExternalLinks as link (link.href)}
				<a href={link.href} rel="noreferrer" target="_blank">{link.label}</a>
			{/each}
			{#if site.showDevLogLinks}
				<a href={`${base}/dev-log`}>{navCopy.devLog}</a>
			{/if}
			{#if site.showLibraryLinks}
				<a href={`${base}/library`}>{navCopy.library}</a>
			{/if}
			<a href={data.rssPath}>{copy.rssFeed}</a>
			<a href={data.rssReaderPath}>{data.ui.rss.openFriendlyPage}</a>
			<a href={`${base}/sitemap.xml`}>{navCopy.sitemap}</a>
			<a href="#articles">{navCopy.articles}</a>
			{#if site.showOwnerControls}
				<FooterAuthControls returnTo="/drafts/" />
			{/if}
		</div>
	</div>

	<div class="site-footer-meta">
		<span>{publishedArticles.length} {copy.posts}</span>
		<span>{copy.staticSite}</span>
	</div>
</footer>
</main>
