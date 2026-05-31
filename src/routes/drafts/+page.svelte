<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authLoginHref, authState, loadAuthState } from '$lib/auth';
	import { articleMatchesTag, articleSearchText } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { Article } from '$lib/articles';

	const title = 'blog.ryanspice.com · Drafts';
	const description = 'Unpublished draft articles and working posts from Ryan Spice.';

	let draftArticles = $state<Article[]>([]);
	let authResolved = $state(false);
	let authError = $state<string | null>(null);
	let draftsLoaded = $state(false);
	let searchQuery = $state('');
	let selectedTag = $state('');

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const latestDraft = $derived(draftArticles[0] ?? null);
	const draftCount = $derived(draftArticles.length);
	const draftArticleTags = $derived(
		Array.from(new Set(draftArticles.flatMap((article) => [...article.tags, ...article.design.tags]))).sort((left, right) =>
			left.localeCompare(right)
		)
	);
	const visibleDrafts = $derived(
		draftArticles.filter((article) => {
			if (selectedTag && !articleMatchesTag(article, selectedTag)) {
				return false;
			}
			if (searchQuery && !articleSearchText(article).includes(searchQuery.toLowerCase())) {
				return false;
			}
			return true;
		})
	);
	const latestDraftAccent = $derived(latestDraft ? articleAccentColor(latestDraft) : 'var(--accent)');

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonical
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		searchQuery = (params.get('q') ?? '').trim();
		selectedTag = (params.get('tag') ?? '').trim();

		try {
			const auth = await loadAuthState();
			authResolved = true;

			if (!auth.authenticated) {
				draftsLoaded = true;
				return;
			}

			const module = await import('$lib/articles');
			draftArticles = module.draftArticles;
			draftsLoaded = true;
		} catch (error_) {
			authResolved = true;
			authError = error_ instanceof Error ? error_.message : 'Unable to load drafts';
			draftsLoaded = true;
		}
	});
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
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={title} />

	{@html `<script type="application/ld+json">${jsonLdEscaped}</script>`}
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

{#if $authState.authenticated}
	{#if !draftsLoaded}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Draft queue · loading drafts</p>
			<h1>Opening the private queue.</h1>
			<p class="dek">The auth gate is open; the draft list is loading from the workspace.</p>
		</div>
		<aside class="hero-card home-hero-card">
			<strong>Loading drafts</strong>
			<p>Pulling the unpublished articles into view.</p>
		</aside>
	</section>
	{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Draft queue · private review</p>
			<h1>Working drafts, research notes, and in-progress posts.</h1>
			<p class="dek">
				These pieces are not published yet. They stay here while the structure, sources, or framing
				is still changing.
			</p>
			<dl class="meta-grid home-meta" aria-label="Draft metadata">
				<div>
					<dt>Drafts</dt>
					<dd>{draftCount}</dd>
				</div>
				<div>
					<dt>Latest</dt>
					<dd>
						{#if latestDraft}
							<time datetime={latestDraft.date}>{latestDraft.dateLabel}</time>
						{:else}
							None yet
						{/if}
					</dd>
				</div>
				<div>
					<dt>Status</dt>
					<dd>Unpublished</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Latest draft" style={`--article-accent: ${latestDraftAccent}`}>
			<strong>Latest draft</strong>
			{#if latestDraft}
				<h2><a href={articleHref(latestDraft)}>{latestDraft.title}</a></h2>
				<p>{latestDraft.summary}</p>
				<dl class="hero-meta" aria-label="Latest draft metadata">
					<div>
						<dt>Updated</dt>
						<dd><time datetime={latestDraft.date}>{latestDraft.dateLabel}</time></dd>
					</div>
					<div>
						<dt>Read time</dt>
						<dd>{latestDraft.readingMinutes} min</dd>
					</div>
					<div>
						<dt>State</dt>
						<dd>Draft</dd>
					</div>
				</dl>
				{#if latestDraft.releaseDateLabel}
					<p class="home-hero-note">Scheduled release: {latestDraft.releaseDateLabel}</p>
				{/if}
			{:else}
				<p>No drafts yet.</p>
			{/if}
		</aside>
	</section>

	<form class="article-filter-bar" method="get" action="/drafts/">
		<label class="filter-field">
			<span>Search</span>
			<input type="text" name="q" value={searchQuery} placeholder="Title, summary, tag..." />
		</label>

		<label class="filter-field">
			<span>Tag</span>
			<select name="tag">
				<option value="" selected={!selectedTag}>All tags</option>
				{#each draftArticleTags as tag (tag)}
					<option value={tag} selected={selectedTag === tag}>{tag}</option>
				{/each}
			</select>
		</label>

		<div class="filter-actions">
			<button type="submit">Update</button>
			<a class="home-filter-link" href="/drafts/">Reset</a>
		</div>
	</form>

	<section id="drafts" class="article-grid" aria-label="Draft articles">
		<div class="section-head">
			<p class="eyebrow">Draft queue</p>
			<h2>Unpublished articles</h2>
			<p class="section-dek">
				Newest drafts first, with release dates and publish state visible for quick review.
			</p>
		</div>
		<p class="article-results-meta">Showing {visibleDrafts.length} of {draftArticles.length} drafts.</p>

		{#if visibleDrafts.length}
			{#each visibleDrafts as article (article.slug)}
				<ArticleCard {article} href={articleHref(article)} />
			{/each}
		{:else}
			<div class="article-empty">
				<p class="eyebrow">{draftArticles.length ? 'No matching drafts' : 'No drafts'}</p>
				<h2>{draftArticles.length ? 'Nothing matches the current filters.' : 'The queue is empty.'}</h2>
				<p class="section-dek">
					{draftArticles.length
						? 'Clear the tag or search field to widen the draft list.'
						: 'Add a draft article under src/lib/content/articles to populate this page.'}
				</p>
			</div>
		{/if}
	</section>
	{/if}
{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Draft queue · Microsoft sign-in required</p>
			<h1>Drafts live behind the auth gate.</h1>
			<p class="dek">
				Sign in with Microsoft to review unpublished articles, set release dates in frontmatter,
				and promote drafts when they are ready to ship.
			</p>
			<dl class="meta-grid home-meta" aria-label="Draft gate metadata">
				<div>
					<dt>State</dt>
					<dd>{authResolved ? 'Locked' : 'Checking access'}</dd>
				</div>
				<div>
					<dt>Access</dt>
					<dd>Microsoft Entra</dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>Private review</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Draft access">
			<strong>{authResolved ? 'Access required' : 'Checking access'}</strong>
			<p>
				{#if $authState.loading}
					Hold on while the auth gate responds.
				{:else}
					The drafts area stays out of the public homepage. Use the Microsoft gateway to open the
					draft queue.
				{/if}
			</p>
			<div class="home-hero-links">
				<a href="/login">Sign in with Microsoft</a>
				<a href={authLoginHref('/drafts/')}>Open drafts</a>
			</div>
			<p class="home-hero-note">
				Promotion remains file-based for now: set <code>status: published</code> to promote, or set
				<code>release_date</code> in the article frontmatter to schedule a release.
			</p>
		</aside>
	</section>
{/if}

{#if authError}
	<p class="drafts-error" role="status">{authError}</p>
{/if}
