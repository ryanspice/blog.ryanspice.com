<script lang="ts">
	import { base } from '$app/paths';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleCardCssVars, articleCardImage, articleFocalImage } from '$lib/article-focal-images';
	import type { Article } from '$lib/articles';
	import { articleHref } from '$lib/article-links';
	import ArticleIcon from '$lib/components/ArticleIcon.svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import HomeFandangoStyles from '$lib/components/HomeFandangoStyles.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const publishedArticles = $derived(Array.isArray(data.publishedArticles) ? data.publishedArticles as Article[] : []);
	const copy = $derived(data.ui.home);
	const navCopy = $derived(data.ui.nav);
	const latestArticles = $derived.by(() => publishedArticles.slice(0, 5));

	const title = $derived(copy.title);
	const description = $derived(copy.description);
	const latestArticle = $derived.by(() => latestArticles[0] ?? null);
	const latestArticleVisual = $derived.by(() => articleCardImage(latestArticle));
	const latestArticleFocal = $derived.by(() => articleFocalImage(latestArticle));
	const latestDate = $derived.by(() => (latestArticle ? latestArticle.date : '2026-05-28'));
	const latestDateLabel = $derived.by(() => (latestArticle ? latestArticle.dateLabel : 'May 28, 2026'));
	const latestArticleHref = $derived.by(() => (latestArticle ? articleHref(latestArticle) : `${base}${data.homePath}#articles`));
	const latestArticleAccent = $derived.by(() => (latestArticle ? articleAccentColor(latestArticle) : 'var(--accent)'));
	const latestArticleCardStyle = $derived.by(() => `--article-accent: ${latestArticleAccent}; ${articleCardCssVars(latestArticle)}`);
	const canonical = $derived(data.canonical);
	const ogImage = $derived(data.ogImage);
</script>

<HomeFandangoStyles />

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
	<meta property="og:site_name" content="blog.ryanspice.com" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: navCopy.articles, href: '#articles' },
		{ label: navCopy.rss, href: data.rssPath },
		{ label: 'ryanspice.com', href: 'https://ryanspice.com' }
	]}
/>

<section class="home-hero" style={`--article-accent: ${latestArticleAccent}`}>
	<div class="home-hero-copy">
		<p class="eyebrow">{copy.eyebrow}</p>
		<h1>{copy.heading}</h1>
		<p class="dek">{copy.dek}</p>
		<div class="home-primary-actions" aria-label="Primary actions">
			<a href={latestArticleHref}>{copy.startLatest}</a>
			<a href="#articles">{copy.browseLatest}</a>
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

	<aside class={`hero-card home-hero-card${latestArticleVisual ? ' has-row-image' : ''}`} aria-label="Latest article" style={latestArticleCardStyle}>
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
				<div><dt>{copy.type}</dt><dd>{latestArticle?.draftType?.replaceAll('-', ' ') ?? 'article'}</dd></div>
			</dl>
			<p class="home-hero-note">{copy.focusNote}</p>
			<div class="home-hero-links" aria-label={copy.quickLinks}>
				<a href={data.rssUrl}>{copy.rssFeed}</a>
				<a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">{navCopy.githubRepo}</a>
			</div>
		</div>
	</aside>
</section>

<section id="articles" class="article-grid" aria-label="Latest published articles">
	<div class="section-head">
		<p class="eyebrow">{copy.latestArticles}</p>
		<h2>{copy.recentPosts}</h2>
		<p class="section-dek">{copy.recentPostsDek}</p>
	</div>

	{#if latestArticles.length}
		{#each latestArticles as article, index (article.slug + ':' + index)}
			<ArticleCard article={article} />
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
			<a href="https://ryanspice.com" rel="noreferrer" target="_blank">ryanspice.com</a>
			<a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">{navCopy.githubRepo}</a>
			<a href={`${base}/dev-log`}>{navCopy.devLog}</a>
			<a href={data.rssPath}>{copy.rssFeed}</a>
			<a href={`${base}/sitemap.xml`}>{navCopy.sitemap}</a>
			<a href="#articles">{navCopy.articles}</a>
			<a href="https://canopydigital.ca" rel="noreferrer" target="_blank">Canopy Digital</a>
			<FooterAuthControls returnTo="/drafts/" />
		</div>
	</div>

	<div class="site-footer-meta">
		<span>{publishedArticles.length} {copy.posts}</span>
		<span>SvelteKit 2 / Svelte 5</span>
		<span>{copy.staticSite}</span>
	</div>
</footer>
