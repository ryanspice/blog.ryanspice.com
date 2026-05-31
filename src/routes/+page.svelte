<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { articleIndexHref, articleMatchesTag, articleSearchText } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { publishedArticleTags, publishedArticles } from '$lib/articles';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'blog.ryanspice.com · Technical notes';
	const description = 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.';
	const indexRootHref = `${base}/`;
	const latestArticle = publishedArticles[0];
	const latestDate = latestArticle ? latestArticle.date : '2026-05-28';
	const latestDateLabel = latestArticle ? latestArticle.dateLabel : 'May 28, 2026';
	const latestArticleHref = latestArticle ? `${base}/${latestArticle.slug}/` : `${base}/#articles`;
	const latestArticleAccent = $derived(latestArticle ? articleAccentColor(latestArticle) : 'var(--accent)');
	const footerLinks = [
		{ label: 'ryanspice.com', href: 'https://ryanspice.com' },
		{ label: 'GitHub repo', href: 'https://github.com/ryanspice/blog.ryanspice.com' },
		{ label: 'Dev log', href: '/dev-log' },
		{ label: 'RSS feed', href: '/rss.xml' },
		{ label: 'Sitemap', href: '/sitemap.xml' }
	];

	const canonical = $derived(data.canonical);
	const rssUrl = $derived(data.rssUrl);
	const ogImage = $derived(data.ogImage);

	let searchQuery = $state('');
	let selectedTag = $state('');
	let compactRequested = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		searchQuery = (params.get('q') ?? '').trim();
		selectedTag = (params.get('tag') ?? '').trim();
		compactRequested = params.get('view') === 'compact';
	});

	const compactMode = $derived(compactRequested || searchQuery.length > 0 || selectedTag.length > 0);
	const browseArticles = $derived(publishedArticles);
	const visibleArticles = $derived(
		browseArticles.filter((article) => {
			if (selectedTag && !articleMatchesTag(article, selectedTag)) return false;
			if (searchQuery && !articleSearchText(article).includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				name: 'blog.ryanspice.com',
				url: canonical
			},
			{
				'@type': 'Person',
				name: 'Ryan Spice',
				url: canonical
			}
		]
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	function hrefFor(href: string): string {
		if (href.startsWith('#') || href.startsWith('http')) return href;
		return `${base}${href}`;
	}

</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="blog.ryanspice.com" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={title} />

	<link rel="alternate" type="application/rss+xml" title="RSS" href={rssUrl} />

	{@html `<script type="application/ld+json">${jsonLdEscaped}</script>`}
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '#articles' },
		{ label: 'RSS', href: '/rss.xml' },
		{ label: 'ryanspice.com', href: 'https://ryanspice.com' }
	]}
/>

{#if !compactMode}
	<section class="home-hero">
		<div class="home-hero-copy">
			<p class="eyebrow">Ryan Spice · technical blog</p>
			<h1>Practical field notes for tooling, web work, AI research, and weird Windows problems.</h1>
			<p class="dek">A SvelteKit-first blog project staged inside the AI Wiki, with repair logs, debugging notes, research comparisons, and a lightweight dev log that stays grounded in the actual workflow.</p>
			<dl class="meta-grid home-meta" aria-label="Site metadata">
				<div>
					<dt>Articles</dt>
					<dd>{publishedArticles.length}</dd>
				</div>
				<div>
					<dt>Latest</dt>
					<dd><time datetime={latestDate}>{latestDateLabel}</time></dd>
				</div>
				<div>
					<dt>Feed</dt>
					<dd>RSS available</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Latest article" style={`--article-accent: ${latestArticleAccent}`}>
			<strong>Latest article</strong>
			<h2><a href={latestArticleHref}>{latestArticle?.title ?? 'Latest article'}</a></h2>
			<p>{latestArticle?.summary ?? 'Recent technical notes and comparisons.'}</p>
			<dl class="hero-meta" aria-label="Latest article metadata">
				<div>
					<dt>Published</dt>
					<dd><time datetime={latestDate}>{latestDateLabel}</time></dd>
				</div>
				<div>
					<dt>Read time</dt>
					<dd>{latestArticle?.readingMinutes ?? 0} min</dd>
				</div>
				<div>
					<dt>Type</dt>
					<dd>{latestArticle?.draftType?.replaceAll('-', ' ') ?? 'article'}</dd>
				</div>
			</dl>
			<p class="home-hero-note">Current focus: source-aware repair logs, practical web work, and research notes that are still readable later.</p>
			<div class="home-hero-links" aria-label="Quick links">
				<a href={hrefFor('/rss.xml')}>RSS feed</a>
				<a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">GitHub repo</a>
			</div>
		</aside>
	</section>
{:else}
	<section class="article-index-shell" aria-label="Compact article index">
		<div class="section-head compact-section-head">
			<p class="eyebrow">Article index</p>
			<h1>{selectedTag ? `Articles tagged ${selectedTag}` : 'Filter articles by tag or text.'}</h1>
			<p class="section-dek">Use the controls below to narrow the list. Clear them to widen the view or return to the full hero home.</p>
		</div>

		<form class="article-filter-bar" method="get" action={indexRootHref}>
			<input type="hidden" name="view" value="compact" />

			<label class="filter-field">
				<span>Search</span>
				<input type="text" name="q" value={searchQuery} placeholder="Title, summary, tag..." />
			</label>

			<label class="filter-field">
				<span>Tag</span>
				<select name="tag">
					<option value="" selected={!selectedTag}>All tags</option>
					{#each publishedArticleTags as tag (tag)}
						<option value={tag} selected={selectedTag === tag}>{tag}</option>
					{/each}
				</select>
			</label>

			<div class="filter-actions">
				<button type="submit">Update</button>
				<a class="home-filter-link" href={articleIndexHref({ view: 'compact' })}>Reset</a>
				<a class="home-filter-link" href={indexRootHref}>Full home</a>
			</div>
		</form>

		<p class="article-results-meta">Showing {visibleArticles.length} of {browseArticles.length} articles.</p>
	</section>
{/if}

<section id="articles" class={`article-grid ${compactMode ? 'compact-grid' : ''}`} aria-label={compactMode ? 'Filtered articles' : 'Published articles'}>
	{#if !compactMode}
		<div class="section-head">
			<p class="eyebrow">Latest articles</p>
			<h2>Recent published posts</h2>
			<p class="section-dek">Published technical notes with dates, reading time, and source-linked metadata.</p>
		</div>
	{/if}

	{#if visibleArticles.length}
		{#each visibleArticles as article (article.slug)}
			<ArticleCard {article} />
		{/each}
	{:else}
		<div class="article-empty">
			<p class="eyebrow">No results</p>
			<h2>No articles match the current filters.</h2>
			<p class="section-dek">Try clearing the tag or broadening the search text.</p>
		</div>
	{/if}
</section>

<footer class="site-footer" aria-label="Site footer">
	<div class="site-footer-grid">
		<div class="site-footer-copy">
			<p class="eyebrow">Elsewhere</p>
			<h2>Links and site info</h2>
			<p class="site-footer-dek">A static SvelteKit blog for technical notes, repair logs, research writeups, and a lightweight dev log for site changes. The public surface stays small and easy to scan.</p>
		</div>

		<div class="site-footer-links">
			{#each footerLinks as link (link.label)}
				<a href={hrefFor(link.href)} rel={link.href.startsWith('http') ? 'noreferrer' : undefined} target={link.href.startsWith('http') ? '_blank' : undefined}>{link.label}</a>
			{/each}
			<a href={hrefFor('#articles')}>Articles</a>
			<a href="https://canopydigital.ca" rel="noreferrer" target="_blank">Canopy Digital</a>
			<FooterAuthControls returnTo="/drafts/" />
		</div>
	</div>

	<div class="site-footer-meta">
		<span>{publishedArticles.length} posts</span>
		<span>SvelteKit 2 / Svelte 5</span>
		<span>Static site</span>
	</div>
</footer>




