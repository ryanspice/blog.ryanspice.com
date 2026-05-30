<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articles } from '$lib/articles';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	const title = 'blog.ryanspice.com · Technical notes';
	const description = 'Technical blog drafts and production notes from Ryan Spice.';
	const latestArticle = articles[0];
	const latestDate = latestArticle ? latestArticle.date : '2026-05-28';
	const latestDateLabel = latestArticle ? latestArticle.dateLabel : 'May 28, 2026';

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const rssUrl = $derived(new URL(`${base}/rss.xml`, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());

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

<section class="home-hero">
	<p class="eyebrow">Ryan Spice · technical blog</p>
	<h1>Practical field notes for tooling, web work, AI research, and weird Windows problems.</h1>
	<p class="dek">A SvelteKit-first blog project staged inside the AI Wiki, with repair logs, debugging notes, and research comparisons that stay grounded in the actual workflow.</p>
	<dl class="meta-grid home-meta" aria-label="Site metadata">
		<div>
			<dt>Articles</dt>
			<dd>{articles.length}</dd>
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
	<div class="home-actions">
		<a class="primary-action" href={`${base}/#articles`}>Read articles</a>
		<a class="secondary-action" href="https://ryanspice.com" rel="noreferrer" target="_blank">ryanspice.com</a>
	</div>
</section>

<section id="articles" class="article-grid" aria-label="Latest articles">
	<div class="section-head">
		<p class="eyebrow">Latest articles</p>
		<h2>Recent posts</h2>
		<p class="section-dek">Published technical notes with dates, reading time, and source-linked metadata.</p>
	</div>
	{#each articles as article (article.slug)}
		<ArticleCard {article} />
	{/each}
</section>
