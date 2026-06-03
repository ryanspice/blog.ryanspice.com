<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, canAccessDrafts, loadAuthState, signIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import { articleMatchesTag, articleSearchText } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import DraftScheduleControls from '$lib/components/DraftScheduleControls.svelte';
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
	let signingIn = $state(false);

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const latestDraft = $derived(draftArticles[0] ?? null);
	const draftCount = $derived(draftArticles.length);
	const scheduledCount = $derived(draftArticles.filter((article) => Boolean(article.releaseDate)).length);
	const draftArticleTags = $derived(
		Array.from(new Set(draftArticles.flatMap((article) => [...article.tags, ...article.design.tags]))).sort(
			(left: string, right: string) => left.localeCompare(right)
		)
	);
	const visibleDrafts = $derived(
		draftArticles.filter((article) => {
			if (selectedTag && !articleMatchesTag(article, selectedTag)) return false;
			if (searchQuery && !articleSearchText(article).includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);
	const latestDraftAccent = $derived(latestDraft ? articleAccentColor(latestDraft) : 'var(--accent)');
	const canViewDrafts = $derived(canAccessDrafts($authState));

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
			authError = error_ instanceof Error ? error_?.message : 'Unable to load drafts';
			draftsLoaded = true;
		}
	});

	async function handleSignIn() {
		signingIn = true;

		try {
			await signIn('/drafts/');
		} finally {
			signingIn = false;
		}
	}
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
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

{#if canViewDrafts}
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
				<h1>Working drafts, research notes, and scheduled releases.</h1>
				<p class="dek">
					These pieces stay here while the structure, sources, or framing is changing. Add a
					<code>release_date</code> to schedule a public release.
				</p>
				<dl class="meta-grid home-meta" aria-label="Draft metadata">
					<div>
						<dt>Drafts</dt>
						<dd>{draftCount}</dd>
					</div>
					<div>
						<dt>Scheduled</dt>
						<dd>{scheduledCount}</dd>
					</div>
					<div>
						<dt>Status</dt>
						<dd>Private queue</dd>
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
							<dd>{latestDraft.releaseDateLabel ? 'Scheduled' : 'Draft'}</dd>
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
					{#each draftArticleTags as tag, index (tag + ':' + index)}
						<option value={tag} selected={selectedTag === tag}>{tag}</option>
					{/each}
				</select>
			</label>

			<div class="filter-actions">
				<button type="submit">Update</button>
				<a class="home-filter-link" href="/drafts/">Reset</a>
			</div>
		</form>

		<section class="draft-schedule-primer" aria-label="Scheduling instructions">
			<p class="eyebrow">Release scheduling</p>
			<h2>Schedule a draft with frontmatter.</h2>
			<p>
				Use the date control on any draft below, copy the generated frontmatter, paste it into that
				article, and commit. The daily deploy promotes it once the release date is reached.
			</p>
		</section>

		<section id="drafts" class="article-grid" aria-label="Draft articles">
			<div class="section-head">
				<p class="eyebrow">Draft queue</p>
				<h2>Unpublished articles</h2>
				<p class="section-dek">Newest drafts first, with release dates and publish state visible for quick review.</p>
			</div>
			<p class="article-results-meta">Showing {visibleDrafts.length} of {draftArticles.length} drafts.</p>

			{#if visibleDrafts.length}
				{#each visibleDrafts as article, index (article.slug + ':' + index)}
					<div class="draft-item" style={`--article-accent: ${articleAccentColor(article)}`}>
						<ArticleCard {article} href={articleHref(article)} />
						<DraftScheduleControls {article} />
					</div>
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
			<p class="dek">Sign in with Microsoft to review unpublished articles before they are ready to ship.</p>
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
				{:else if $authState.authenticated && !$authState.draftsAllowed}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but drafts are only open to
					spice.ryan@hotmail.com. Use the footer button to switch accounts.
				{:else}
					The drafts area stays out of the public homepage. Use the Microsoft gateway to open the draft queue.
				{/if}
			</p>
			<div class="home-hero-links">
				<button type="button" class="plain-action" onclick={handleSignIn} disabled={signingIn || !$authState.available}>
					{signingIn
						? 'Opening Microsoft…'
						: $authState.authenticated && !$authState.draftsAllowed
							? 'Try another account'
							: 'Sign in with Microsoft'}
				</button>
			</div>
			<p class="home-hero-note">
				Promotion remains file-based for now: set <code>status: "published"</code> to promote, or set
				<code>release_date</code> in the article frontmatter to schedule a release.
			</p>
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls returnTo="/drafts/" />
</footer>
{#if authError}
	<p class="drafts-error" role="status">{authError}</p>
{/if}

<style>
	.draft-item {
		display: grid;
		gap: 12px;
	}

	.draft-schedule-primer {
		max-width: min(1120px, calc(100vw - 32px));
		margin: 0 auto 22px;
		padding: 18px;
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
	}

	.draft-schedule-primer h2,
	.draft-schedule-primer p {
		margin: 0;
	}

	.draft-schedule-primer h2 {
		margin-top: 4px;
	}

	.draft-schedule-primer p:not(.eyebrow) {
		margin-top: 8px;
		opacity: 0.82;
	}
</style>
