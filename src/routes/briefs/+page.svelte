<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { authState, canAccessDrafts, loadAuthState, ownerAccessLabel, trySignIn } from '$lib/auth';
	import BriefArchive from '$lib/components/BriefArchive.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { MorningBrief } from '$lib/morning-briefs';

	const title = 'blog.ryanspice.com · Morning Briefs';
	const description = 'Private weekday project briefs for Ryan Spice.';

	let briefs = $state<MorningBrief[]>([]);
	let authResolved = $state(false);
	let briefsLoaded = $state(false);
	let authError = $state<string | null>(null);
	let selectedTag = $state('');
	let searchQuery = $state('');
	let signingIn = $state(false);
	let actionError = $state('');
	let briefsInitialized = $state(false);

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const canViewBriefs = $derived(canAccessDrafts($authState));
	const briefTags = $derived(collectBriefTags(briefs));
	const visibleBriefs = $derived(filterBriefs(briefs, selectedTag, searchQuery));
	const latestBrief = $derived(briefs[0] ?? null);

	const jsonLd = $derived(collectionPageJsonLd(title, description, canonical));
	$effect(() => {
		if (briefsInitialized) return;
		briefsInitialized = true;
		void initializeBriefs();
	});

	async function initializeBriefs() {
		const params = new URLSearchParams(window.location.search);
		searchQuery = (params.get('q') ?? '').trim();
		selectedTag = (params.get('tag') ?? '').trim();

		try {
			const auth = await loadAuthState();
			authResolved = true;

			if (!auth.authenticated) {
				briefsLoaded = true;
				return;
			}

			const module = await import('$lib/morning-briefs');
			briefs = module.visibleMorningBriefs;
			briefsLoaded = true;
		} catch (error_) {
			authResolved = true;
			authError = error_ instanceof Error ? error_.message : 'Unable to load morning briefs';
			briefsLoaded = true;
		}
	}

	function collectBriefTags(items: MorningBrief[]): string[] {
		return Array.from(new Set(items.flatMap((brief) => brief.tags))).sort((left, right) => left.localeCompare(right));
	}

	function filterBriefs(items: MorningBrief[], tag: string, query: string): MorningBrief[] {
		const normalizedTag = tag.toLowerCase();
		const normalizedQuery = query.toLowerCase();
		return items.filter((brief) => {
			if (normalizedTag && !brief.tags.some((briefTag) => briefTag.toLowerCase() === normalizedTag)) {
				return false;
			}

			if (normalizedQuery) {
				const text = [brief.title, brief.summary, ...brief.tags, ...brief.projects].join(' ').toLowerCase();
				if (!text.includes(normalizedQuery)) return false;
			}

			return true;
		});
	}

	function collectionPageJsonLd(pageTitle: string, pageDescription: string, pageUrl: string): Record<string, string> {
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
			actionError = (await trySignIn('/briefs/')) ?? '';
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
				This route uses the same Microsoft owner check as drafts. It is a static-site UI gate, so
				briefs must stay sanitized and free of secrets.
			</p>
			{#if latestBrief}
				<a class="plain-action" href={`${base}/briefs/${latestBrief.slug}/`}>Open latest brief</a>
			{/if}
		</aside>
	</section>

	{#if !briefsLoaded}
		<section class="article-grid" aria-label="Loading briefs">
			<div class="article-empty">
				<p class="eyebrow">Loading</p>
				<h2>Opening the private brief lane.</h2>
			</div>
		</section>
	{:else}
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
					<dd>{authResolved ? 'Locked' : 'Checking access'}</dd>
				</div>
				<div>
					<dt>Access</dt>
					<dd>Microsoft owner gate</dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>Private brief</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Brief access">
			<strong>{authResolved ? 'Access required' : 'Checking access'}</strong>
			<p>
				{#if $authState.loading}
					Hold on while the auth gate responds.
				{:else if $authState.authenticated && !$authState.draftsAllowed}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but briefs are only open to
					{ownerAccessLabel}. Use the footer button to switch accounts.
				{:else}
					The brief archive is not part of public navigation or search indexing.
				{/if}
			</p>
			<div class="home-hero-links">
				<button type="button" class="plain-action" onclick={handleSignIn} disabled={signingIn || !$authState.available}>
					{signingIn
						? 'Opening Microsoft...'
						: $authState.authenticated && !$authState.draftsAllowed
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
	<FooterAuthControls returnTo="/briefs/" />
</footer>
{#if authError}
	<p class="drafts-error" role="status">{authError}</p>
{/if}
