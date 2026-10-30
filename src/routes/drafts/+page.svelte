<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import {
		acquireOwnerAccessToken,
		authState,
		loadAuthState,
		ownerAccessLabel,
		trySignIn
	} from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import { articleMatchesTag, articleSearchText } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import DraftArchive from '$lib/components/DraftArchive.svelte';
	import DraftMetadataControls from '$lib/components/DraftMetadataControls.svelte';
	import LatestDraftCard from '$lib/components/LatestDraftCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { Article } from '$lib/articles';

	type AccessState = 'checking' | 'locked' | 'verifying' | 'allowed' | 'denied' | 'error';

	const title = 'blog.ryanspice.com · Drafts';
	const description = 'Unpublished draft articles and working posts from Ryan Spice.';

	let draftArticles = $state<Article[]>([]);
	let authResolved = $state(false);
	let draftsLoaded = $state(false);
	let searchQuery = $derived(browser ? (page.url.searchParams.get('q') ?? '').trim() : '');
	let selectedTag = $derived(browser ? (page.url.searchParams.get('tag') ?? '').trim() : '');
	const selectedSlug = $derived(browser ? (page.url.searchParams.get('slug') ?? '').trim() : '');
	let selectedArticle = $state<Article | null>(null);
	let articleLoading = $state(false);
	let articleError = $state('');
	let signingIn = $state(false);
	let actionError = $state('');
	let accessState = $state<AccessState>('checking');
	let accessError = $state('');
	let selectionRequest = 0;

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const latestDraft = $derived(draftArticles[0] ?? null);
	const draftCount = $derived(draftArticles.length);
	const scheduledCount = $derived(countScheduledDrafts(draftArticles));
	const draftArticleTags = $derived(collectDraftTags(draftArticles));
	const visibleDrafts = $derived(filterDrafts(draftArticles, selectedTag, searchQuery));
	const latestDraftAccent = $derived(latestDraft ? articleAccentColor(latestDraft) : 'var(--accent)');
	const canViewDrafts = $derived(accessState === 'allowed');
	const returnTo = $derived(
		selectedSlug ? `/drafts/?slug=${encodeURIComponent(selectedSlug)}` : '/drafts/'
	);

	onMount(() => {
		void initializeDrafts();
	});

	afterNavigate(refreshSelection);

	function refreshSelection() {
		const slug = selectedSlug;
		const allowed = canViewDrafts;
		const request = ++selectionRequest;
		selectedArticle = null;
		articleError = '';
		articleLoading = false;
		if (allowed && slug) void loadSelectedArticle(slug, request);
	}

	async function initializeDrafts() {
		try {
			const auth = await loadAuthState();
			authResolved = true;

			if (!auth.authenticated) {
				accessState = 'locked';
				draftsLoaded = true;
				return;
			}

			await loadDraftList();
		} catch (error_) {
			authResolved = true;
			accessState = 'error';
			accessError = error_ instanceof Error ? error_.message : 'Unable to start the private draft session.';
			draftsLoaded = true;
		}
	}

	async function privateGet(path: string): Promise<Response> {
		const token = await acquireOwnerAccessToken();
		return fetch(`${base}${path}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json'
			},
			cache: 'no-store',
			credentials: 'omit'
		});
	}

	async function loadDraftList() {
		accessState = 'verifying';
		accessError = '';
		draftsLoaded = false;

		try {
			const response = await privateGet('/drafts/owner/private/');
			if (response.status === 401) {
				accessState = 'locked';
				accessError = 'The Microsoft session expired. Sign in again to open the draft queue.';
				draftsLoaded = true;
				return;
			}
			if (response.status === 403) {
				accessState = 'denied';
				draftsLoaded = true;
				return;
			}
			if (response.status === 503) {
				accessState = 'error';
				accessError = 'Private draft storage is unavailable.';
				draftsLoaded = true;
				return;
			}
			if (!response.ok) {
				throw new Error(`Private draft request failed (${response.status}).`);
			}

			const payload = (await response.json()) as unknown;
			if (!isDraftListPayload(payload)) {
				throw new Error('Private draft response was invalid.');
			}

			draftArticles = payload.articles;
			accessState = 'allowed';
			draftsLoaded = true;
			refreshSelection();
		} catch (error_) {
			accessState = 'error';
			accessError = error_ instanceof Error ? error_.message : 'Unable to load the private draft queue.';
			draftsLoaded = true;
		}
	}

	async function loadSelectedArticle(slug: string, request: number) {
		articleLoading = true;
		articleError = '';
		selectedArticle = null;

		try {
			const response = await privateGet(`/drafts/owner/private/?slug=${encodeURIComponent(slug)}`);
			if (request !== selectionRequest) return;
			if (response.status === 404) {
				articleError = 'Draft not found';
				return;
			}
			if (response.status === 400) {
				articleError = 'Invalid draft slug';
				return;
			}
			if (response.status === 401) {
				accessState = 'locked';
				accessError = 'The Microsoft session expired. Sign in again to open the draft preview.';
				return;
			}
			if (response.status === 403) {
				accessState = 'denied';
				return;
			}
			if (response.status === 503) {
				articleError = 'Private draft storage is unavailable';
				return;
			}
			if (!response.ok) {
				throw new Error(`Private draft request failed (${response.status}).`);
			}

			const payload = (await response.json()) as unknown;
			if (request !== selectionRequest) return;
			if (!isDraftArticlePayload(payload)) {
				throw new Error('Private draft response was invalid.');
			}

			selectedArticle = payload.article;
		} catch (error_) {
			if (request === selectionRequest) articleError = error_ instanceof Error ? error_.message : 'Unable to load the draft.';
		} finally {
			if (request === selectionRequest) articleLoading = false;
		}
	}

	function isDraftListPayload(value: unknown): value is { ok: true; articles: Article[] } {
		return (
			typeof value === 'object' &&
			value !== null &&
			(value as { ok?: unknown }).ok === true &&
			Array.isArray((value as { articles?: unknown }).articles)
		);
	}

	function isDraftArticlePayload(value: unknown): value is { ok: true; article: Article } {
		return (
			typeof value === 'object' &&
			value !== null &&
			(value as { ok?: unknown }).ok === true &&
			typeof (value as { article?: unknown }).article === 'object' &&
			(value as { article?: unknown }).article !== null
		);
	}

	async function handleSignIn() {
		signingIn = true;
		actionError = '';

		try {
			actionError = (await trySignIn(returnTo)) ?? '';
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
	{#if selectedSlug}
		{#if articleLoading}
			<section class="home-hero compact-page">
				<div class="home-hero-copy">
					<p class="eyebrow">Private draft preview · loading article</p>
					<h1>Opening the draft preview.</h1>
					<p class="dek">The owner check passed; the private article is loading from server-only storage.</p>
				</div>
			</section>
		{:else if selectedArticle}
			<section class="draft-detail-controls" style:--article-accent={selectedArticle.design.accent}>
				<a href={`${base}/drafts/`}>Back to drafts</a>
				{#key selectedArticle.slug}
					<DraftMetadataControls article={selectedArticle} />
				{/key}
			</section>
			<ArticleView article={selectedArticle} />
		{:else}
			<section class="article-grid" aria-label="Draft error">
				<div class="article-empty">
					<p class="eyebrow">Draft unavailable</p>
					<h2>{articleError || 'Unable to load the draft.'}</h2>
					<p class="section-dek">The draft may have been promoted, renamed, or is not available in this workspace.</p>
				</div>
			</section>
		{/if}
	{:else if !draftsLoaded}
		<section class="home-hero compact-page">
			<div class="home-hero-copy">
				<p class="eyebrow">Draft queue · verifying owner</p>
				<h1>Opening the private queue.</h1>
				<p class="dek">The server is verifying the Microsoft owner session before any draft metadata is read.</p>
			</div>
			<aside class="hero-card home-hero-card">
				<strong>Verifying access</strong>
				<p>The draft list stays locked until that check completes.</p>
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
					<dd>{authResolved ? (accessState === 'verifying' ? 'Verifying owner' : 'Locked') : 'Checking access'}</dd>
				</div>
				<div>
					<dt>Access</dt>
					<dd>Microsoft Entra</dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>Server-verified private review</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Draft access">
			<strong>{authResolved ? 'Access required' : 'Checking access'}</strong>
			<p>
				{#if $authState.loading || accessState === 'checking'}
					Hold on while the auth gate responds.
				{:else if accessState === 'denied'}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but the server did not authorize
					this account for drafts. Only {ownerAccessLabel} can open them.
				{:else if accessState === 'error'}
					{accessError || 'The private draft queue is unavailable.'}
				{:else if actionError}
					{actionError}
				{:else if accessState === 'verifying'}
					The server is verifying the Microsoft owner session.
				{:else}
					The drafts area stays out of the public homepage. Use the Microsoft gateway to open the draft queue.
				{/if}
			</p>
			<div class="home-hero-links">
				<button type="button" class="plain-action" onclick={handleSignIn} disabled={signingIn || !$authState.available}>
					{signingIn
						? 'Opening Microsoft…'
						: $authState.authenticated && accessState === 'denied'
							? 'Try another account'
							: 'Sign in with Microsoft'}
				</button>
			</div>
			<p class="home-hero-note">
				{#if actionError}
					{actionError}
				{:else if accessState === 'error'}
					No draft metadata is loaded when the server-side owner check cannot complete.
				{:else}
					Promotion remains file-based for now: set <code>status: "published"</code> to promote, or set
					<code>release_date</code> in the article frontmatter to schedule a release.
				{/if}
			</p>
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls {returnTo} />
</footer>
{#if accessError && accessState === 'error'}
	<p class="drafts-error" role="status">{accessError}</p>
{/if}

<style>
	.draft-detail-controls {
		width: min(1120px, calc(100vw - 32px));
		margin: 24px auto 0;
	}
</style>
