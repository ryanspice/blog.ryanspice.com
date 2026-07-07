<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { authState, canAccessDrafts, loadAuthState, ownerAccessLabel, trySignIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import { articleMatchesTag, articleSearchText } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import DraftArchive from '$lib/components/DraftArchive.svelte';
	import LatestDraftCard from '$lib/components/LatestDraftCard.svelte';
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
	let actionError = $state('');
	let draftsInitialized = $state(false);

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const latestDraft = $derived(draftArticles[0] ?? null);
	const draftCount = $derived(draftArticles.length);
	const scheduledCount = $derived(countScheduledDrafts(draftArticles));
	const draftArticleTags = $derived(collectDraftTags(draftArticles));
	const visibleDrafts = $derived(filterDrafts(draftArticles, selectedTag, searchQuery));
	const latestDraftAccent = $derived(latestDraft ? articleAccentColor(latestDraft) : 'var(--accent)');
	const canViewDrafts = $derived(canAccessDrafts($authState));

	$effect(() => {
		if (draftsInitialized) return;
		draftsInitialized = true;
		void initializeDrafts();
	});

	async function initializeDrafts() {
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
	}

	async function handleSignIn() {
		signingIn = true;
		actionError = '';

		try {
			actionError = (await trySignIn('/drafts/')) ?? '';
		} finally {
			signingIn = false;
		}
	}

	function countScheduledDrafts(articles: Article[]): number {
		return articles.filter((article) => Boolean(article.releaseDate)).length;
	}

	function collectDraftTags(articles: Article[]): string[] {
		return Array.from(new Set(articles.flatMap((article) => [...article.tags, ...article.design.tags]))).sort(
			(left, right) => left.localeCompare(right)
		);
	}

	function filterDrafts(articles: Article[], tag: string, query: string): Article[] {
		const normalizedQuery = query.toLowerCase();
		return articles.filter((article) => {
			if (tag && !articleMatchesTag(article, tag)) return false;
			if (normalizedQuery && !articleSearchText(article).includes(normalizedQuery)) return false;
			return true;
		});
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

			<LatestDraftCard {latestDraft} accent={latestDraftAccent} />
		</section>

		<DraftArchive {draftArticles} {visibleDrafts} {draftArticleTags} {selectedTag} {searchQuery} />
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
					{ownerAccessLabel}. Use the footer button to switch accounts.
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
				{#if actionError}
					{actionError}
				{:else}
					Promotion remains file-based for now: set <code>status: "published"</code> to promote, or set
					<code>release_date</code> in the article frontmatter to schedule a release.
				{/if}
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
