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
	import BriefArchive from '$lib/components/BriefArchive.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import SafeHtml from '$lib/components/SafeHtml.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import {
		collectMorningBriefTags,
		filterMorningBriefs,
		type MorningBrief
	} from '$lib/morning-briefs';

	type AccessState = 'checking' | 'locked' | 'verifying' | 'allowed' | 'denied' | 'error';

	const title = 'blog.ryanspice.com · Morning Briefs';
	const description = 'Private weekday project briefs for Ryan Spice.';

	let briefs = $state<MorningBrief[]>([]);
	let selectedBrief = $state<MorningBrief | null>(null);
	const selectedSlug = $derived(browser ? (page.url.searchParams.get('slug') ?? '').trim() : '');
	let briefLoading = $state(false);
	let briefError = $state('');
	let authResolved = $state(false);
	let briefsLoaded = $state(false);
	let selectedTag = $derived(browser ? (page.url.searchParams.get('tag') ?? '').trim() : '');
	let searchQuery = $derived(browser ? (page.url.searchParams.get('q') ?? '').trim() : '');
	let signingIn = $state(false);
	let actionError = $state('');
	let accessState = $state<AccessState>('checking');
	let accessError = $state('');
	let selectionRequest = 0;

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const canViewBriefs = $derived(accessState === 'allowed');
	const briefTags = $derived(collectMorningBriefTags(briefs));
	const visibleBriefs = $derived(filterMorningBriefs(briefs, selectedTag, searchQuery));
	const latestBrief = $derived(briefs[0] ?? null);
	const jsonLd = $derived(collectionPageJsonLd(title, description, canonical));
	const returnTo = $derived(
		selectedSlug ? `/briefs/?slug=${encodeURIComponent(selectedSlug)}` : '/briefs/'
	);

	onMount(() => {
		void initializeBriefs();
	});

	afterNavigate(refreshSelection);

	function refreshSelection() {
		const slug = selectedSlug;
		const allowed = canViewBriefs;
		const request = ++selectionRequest;
		selectedBrief = null;
		briefError = '';
		briefLoading = false;
		if (allowed && slug) void loadSelectedBrief(slug, request);
	}

	async function initializeBriefs() {
		try {
			const auth = await loadAuthState();
			authResolved = true;

			if (!auth.authenticated) {
				accessState = 'locked';
				briefsLoaded = true;
				return;
			}

			await loadBriefList();
		} catch (error_) {
			authResolved = true;
			accessState = 'error';
			accessError =
				error_ instanceof Error ? error_.message : 'Unable to start the private brief session.';
			briefsLoaded = true;
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

	async function loadBriefList() {
		accessState = 'verifying';
		accessError = '';
		briefsLoaded = false;

		try {
			const response = await privateGet('/drafts/owner/private/?kind=briefs');
			if (response.status === 401) {
				accessState = 'locked';
				accessError = 'The Microsoft session expired. Sign in again to open the brief archive.';
				briefsLoaded = true;
				return;
			}
			if (response.status === 403) {
				accessState = 'denied';
				briefsLoaded = true;
				return;
			}
			if (response.status === 503) {
				accessState = 'error';
				accessError =
					'Private brief storage is unavailable. The private content root or owner configuration is missing on this server.';
				briefsLoaded = true;
				return;
			}
			if (!response.ok) {
				throw new Error(`Private brief request failed (${response.status}).`);
			}

			const payload = (await response.json()) as unknown;
			if (!isBriefListPayload(payload)) {
				throw new Error('Private brief response was invalid.');
			}

			briefs = payload.briefs;
			accessState = 'allowed';
			briefsLoaded = true;
			refreshSelection();
		} catch (error_) {
			accessState = 'error';
			accessError =
				error_ instanceof Error ? error_.message : 'Unable to load the private brief archive.';
			briefsLoaded = true;
		}
	}

	async function loadSelectedBrief(slug: string, request: number) {
		briefLoading = true;
		briefError = '';
		selectedBrief = null;

		try {
			const response = await privateGet(
				`/drafts/owner/private/?kind=briefs&slug=${encodeURIComponent(slug)}`
			);
			if (request !== selectionRequest) return;
			if (response.status === 404) {
				briefError = 'Morning brief not found';
				return;
			}
			if (response.status === 400) {
				briefError = 'Invalid brief slug';
				return;
			}
			if (response.status === 401) {
				accessState = 'locked';
				accessError = 'The Microsoft session expired. Sign in again to open the brief.';
				return;
			}
			if (response.status === 403) {
				accessState = 'denied';
				return;
			}
			if (response.status === 503) {
				briefError = 'Private brief storage is unavailable';
				return;
			}
			if (!response.ok) {
				throw new Error(`Private brief request failed (${response.status}).`);
			}

			const payload = (await response.json()) as unknown;
			if (request !== selectionRequest) return;
			if (!isBriefArticlePayload(payload)) {
				throw new Error('Private brief response was invalid.');
			}

			selectedBrief = payload.brief;
		} catch (error_) {
			if (request === selectionRequest) briefError = error_ instanceof Error ? error_.message : 'Unable to load the brief.';
		} finally {
			if (request === selectionRequest) briefLoading = false;
		}
	}

	function isBriefListPayload(value: unknown): value is { ok: true; briefs: MorningBrief[] } {
		return (
			typeof value === 'object' &&
			value !== null &&
			(value as { ok?: unknown }).ok === true &&
			Array.isArray((value as { briefs?: unknown }).briefs)
		);
	}

	function isBriefArticlePayload(value: unknown): value is { ok: true; brief: MorningBrief } {
		return (
			typeof value === 'object' &&
			value !== null &&
			(value as { ok?: unknown }).ok === true &&
			typeof (value as { brief?: unknown }).brief === 'object' &&
			(value as { brief?: unknown }).brief !== null
		);
	}

	function collectionPageJsonLd(
		pageTitle: string,
		pageDescription: string,
		pageUrl: string
	): Record<string, string> {
		return {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: pageTitle,
			description: pageDescription,
			url: pageUrl
		};
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
</script>

<JsonLd value={jsonLd} />

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
		{ label: 'Dev log', href: '/dev-log' },
		{ label: 'Drafts', href: '/drafts' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

{#if canViewBriefs}
	{#if selectedSlug}
		{#if briefLoading}
			<section class="home-hero compact-page">
				<div class="home-hero-copy">
					<p class="eyebrow">Private morning brief · loading</p>
					<h1>Opening the brief.</h1>
					<p class="dek">The owner check passed; the brief is loading from server-only storage.</p>
				</div>
			</section>
		{:else if selectedBrief}
			<section class="home-hero compact-page private-brief-hero">
				<div class="home-hero-copy">
					<p class="eyebrow">Morning brief · owner only</p>
					<h1>{selectedBrief.title}</h1>
					<p class="dek">{selectedBrief.summary}</p>
					<dl class="meta-grid home-meta" aria-label="Brief metadata">
						<div>
							<dt>Date</dt>
							<dd><time datetime={selectedBrief.date}>{selectedBrief.dateLabel}</time></dd>
						</div>
						<div>
							<dt>Read time</dt>
							<dd>{selectedBrief.readingMinutes} min</dd>
						</div>
						<div>
							<dt>Status</dt>
							<dd>{selectedBrief.status}</dd>
						</div>
					</dl>
					<div class="tag-row" aria-label="Brief tags">
						{#each selectedBrief.tags as tag, index (tag + ':' + index)}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</div>

				<aside class="hero-card home-hero-card" aria-label="Privacy notes">
					<strong>Private website lane</strong>
					<p>
						This content is delivered only after the server verifies the owner Microsoft account.
						Keep every brief sanitized before adding it here.
					</p>
					<a class="plain-action" href={`${base}/briefs/`}>Back to briefs</a>
				</aside>
			</section>

			<main class="layout private-brief-layout">
				<aside class="toc article-toc article-toc--desktop" aria-label="Brief contents">
					<h2>Contents</h2>
					{#each selectedBrief.toc as item, index (item.id + ':' + index)}
						<a class={{ 'toc-l3': item.level === 3 }} href={`#${item.id}`}>{item.text}</a>
					{/each}
				</aside>

				<article class="article-shell">
					<SafeHtml class="article-inner private-brief-inner" html={selectedBrief.html} />
				</article>
			</main>
		{:else}
			<section class="article-grid" aria-label="Morning brief error">
				<div class="article-empty">
					<p class="eyebrow">Brief unavailable</p>
					<h2>{briefError || 'Unable to load the brief.'}</h2>
					<p class="section-dek">The brief may have been renamed, archived, or removed.</p>
					<a class="plain-action" href={`${base}/briefs/`}>Back to briefs</a>
				</div>
			</section>
		{/if}
	{:else if !briefsLoaded}
		<section class="home-hero compact-page private-brief-hero">
			<div class="home-hero-copy">
				<p class="eyebrow">Morning briefs · verifying owner</p>
				<h1>Opening the private brief lane.</h1>
				<p class="dek">
					The server is verifying the Microsoft owner session before any brief metadata is read.
				</p>
			</div>
		</section>
	{:else}
		<section class="home-hero compact-page private-brief-hero">
			<div class="home-hero-copy">
				<p class="eyebrow">Morning briefs · private owner lane</p>
				<h1>Weekday focus notes, research queue, and project watchlist.</h1>
				<p class="dek">
					Briefs are sanitized and owner-gated. They are for deciding what deserves attention next,
					not for publishing raw local context.
				</p>
				<dl class="meta-grid home-meta" aria-label="Brief metadata">
					<div>
						<dt>Briefs</dt>
						<dd>{briefs.length}</dd>
					</div>
					<div>
						<dt>Latest</dt>
						<dd>{latestBrief ? latestBrief.dateLabel : 'None yet'}</dd>
					</div>
					<div>
						<dt>Access</dt>
						<dd>Owner only</dd>
					</div>
				</dl>
			</div>

			<aside class="hero-card home-hero-card" aria-label="Morning brief privacy model">
				<strong>Privacy model</strong>
				<p>
					This route uses the same Microsoft owner check as drafts. Brief bodies are delivered by the
					server only after that check passes, so no private Markdown is shipped in the static build.
				</p>
				{#if latestBrief}
					<a class="plain-action" href={`${base}/briefs/?slug=${encodeURIComponent(latestBrief.slug)}`}>
						Open latest brief
					</a>
				{/if}
			</aside>
		</section>

		<BriefArchive {briefs} {visibleBriefs} {briefTags} {selectedTag} {searchQuery} />
	{/if}
{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Morning briefs · Microsoft sign-in required</p>
			<h1>Briefs stay behind the owner gate.</h1>
			<p class="dek">
				Sign in with Microsoft to open the private weekday focus notes. Only
				{ownerAccessLabel} can read this lane on the website.
			</p>
			<dl class="meta-grid home-meta" aria-label="Brief gate metadata">
				<div>
					<dt>State</dt>
					<dd>{authResolved ? (accessState === 'verifying' ? 'Verifying owner' : 'Locked') : 'Checking access'}</dd>
				</div>
				<div>
					<dt>Access</dt>
					<dd>Microsoft owner gate</dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>Server-verified private brief</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Brief access">
			<strong>{authResolved ? 'Access required' : 'Checking access'}</strong>
			<p>
				{#if $authState.loading || accessState === 'checking'}
					Hold on while the auth gate responds.
				{:else if accessState === 'denied'}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but the server did not authorize
					this account for briefs. Only {ownerAccessLabel} can open them.
				{:else if accessState === 'error'}
					{accessError || 'The private brief archive is unavailable.'}
				{:else if actionError}
					{actionError}
				{:else if accessState === 'verifying'}
					The server is verifying the Microsoft owner session.
				{:else}
					The brief archive is not part of public navigation or search indexing.
				{/if}
			</p>
			<div class="home-hero-links">
				<button type="button" class="plain-action" onclick={handleSignIn} disabled={signingIn || !$authState.available}>
					{signingIn
						? 'Opening Microsoft...'
						: $authState.authenticated && accessState === 'denied'
							? 'Try another account'
							: 'Sign in with Microsoft'}
				</button>
			</div>
			{#if actionError}
				<p class="home-hero-note">{actionError}</p>
			{/if}
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls {returnTo} />
</footer>
{#if accessError && accessState === 'error'}
	<p class="drafts-error" role="status">{accessError}</p>
{/if}
