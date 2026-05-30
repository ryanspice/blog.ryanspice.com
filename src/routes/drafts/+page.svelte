<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { draftArticles } from '$lib/articles';
	import { articleAccentColor } from '$lib/article-accent';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	const title = 'blog.ryanspice.com · Drafts';
	const description = 'Unpublished draft articles and working posts from Ryan Spice.';
	const latestDraft = draftArticles[0];
	const latestDate = latestDraft ? latestDraft.date : '2026-05-30';
	const latestDateLabel = latestDraft ? latestDraft.dateLabel : 'May 30, 2026';
	const latestDraftHref = latestDraft ? `${base}/${latestDraft.slug}/` : `${base}/`;
	const latestDraftAccent = $derived(latestDraft ? articleAccentColor(latestDraft) : 'var(--accent)');

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const draftCount = draftArticles.length;

</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="noindex, nofollow" />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="blog.ryanspice.com" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' },
		{ label: 'ryanspice.com', href: 'https://ryanspice.com' }
	]}
/>

<section class="home-hero">
	<div class="home-hero-copy">
		<p class="eyebrow">Draft queue · unpublished articles</p>
		<h1>Working drafts, research notes, and in-progress posts.</h1>
		<p class="dek">These pieces are not published yet. They stay here while the structure, sources, or framing is still changing.</p>
		<dl class="meta-grid home-meta" aria-label="Draft metadata">
			<div>
				<dt>Drafts</dt>
				<dd>{draftCount}</dd>
			</div>
			<div>
				<dt>Latest</dt>
				<dd><time datetime={latestDate}>{latestDateLabel}</time></dd>
			</div>
			<div>
				<dt>Status</dt>
				<dd>Unpublished</dd>
			</div>
		</dl>
	</div>

	<aside class="hero-card home-hero-card" aria-label="Latest draft" style={`--article-accent: ${latestDraftAccent}`}>
		<strong>Latest draft</strong>
		<h2><a href={latestDraftHref}>{latestDraft?.title ?? 'No drafts yet'}</a></h2>
		<p>{latestDraft?.summary ?? 'Drafts will appear here once they are added.'}</p>
		<dl class="hero-meta" aria-label="Latest draft metadata">
			<div>
				<dt>Updated</dt>
				<dd><time datetime={latestDate}>{latestDateLabel}</time></dd>
			</div>
			<div>
				<dt>Read time</dt>
				<dd>{latestDraft?.readingMinutes ?? 0} min</dd>
			</div>
			<div>
				<dt>State</dt>
				<dd>Draft</dd>
			</div>
		</dl>
		<p class="home-hero-note">This page groups every draft article, including new attachments that are not ready for the public homepage yet.</p>
	</aside>
</section>

<section id="drafts" class="article-grid" aria-label="Draft articles">
	<div class="section-head">
		<p class="eyebrow">Draft queue</p>
		<h2>Unpublished articles</h2>
		<p class="section-dek">Newest drafts first, so the latest work is easiest to review.</p>
	</div>
	{#each draftArticles as article (article.slug)}
		<ArticleCard {article} />
	{/each}
</section>
