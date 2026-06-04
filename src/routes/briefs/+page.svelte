<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, canAccessDrafts, loadAuthState, signIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
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

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const canViewBriefs = $derived(canAccessDrafts($authState));
	const briefTags = $derived(
		Array.from(new Set(briefs.flatMap((brief) => brief.tags))).sort((left, right) =>
			left.localeCompare(right)
		)
	);
	const visibleBriefs = $derived.by(() =>
		briefs.filter((brief) => {
			if (selectedTag && !brief.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) {
				return false;
			}

			if (searchQuery) {
				const text = [brief.title, brief.summary, ...brief.tags, ...brief.projects].join(' ').toLowerCase();
				if (!text.includes(searchQuery.toLowerCase())) return false;
			}

			return true;
		})
	);
	const latestBrief = $derived(briefs[0] ?? null);

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
	});

	async function handleSignIn() {
		signingIn = true;

		try {
			await signIn('/briefs/');
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
		<form class="article-filter-bar" method="get" action="/briefs/">
			<label class="filter-field">
				<span>Search</span>
				<input type="text" name="q" value={searchQuery} placeholder="Focus, project, tag..." />
			</label>

			<label class="filter-field">
				<span>Tag</span>
				<select name="tag">
					<option value="" selected={!selectedTag}>All tags</option>
					{#each briefTags as tag, index (tag + ':' + index)}
						<option value={tag} selected={selectedTag === tag}>{tag}</option>
					{/each}
				</select>
			</label>

			<div class="filter-actions">
				<button type="submit">Update</button>
				<a class="home-filter-link" href="/briefs/">Reset</a>
			</div>
		</form>

		<section class="article-grid private-brief-grid" aria-label="Morning briefs">
			<div class="section-head">
				<p class="eyebrow">Private briefs</p>
				<h2>Morning brief archive</h2>
				<p class="section-dek">
					Readable only after owner sign-in. Newest briefs appear first.
				</p>
			</div>
			<p class="article-results-meta">Showing {visibleBriefs.length} of {briefs.length} briefs.</p>

			{#if visibleBriefs.length}
				{#each visibleBriefs as brief, index (brief.slug + ':' + index)}
					<a class="brief-card article-card-link" href={`${base}/briefs/${brief.slug}/`}>
						<p class="related-kicker"><time datetime={brief.date}>{brief.dateLabel}</time></p>
						<h3>{brief.title}</h3>
						<p>{brief.summary}</p>
						<div class="tag-row compact" aria-label={`${brief.title} tags`}>
							{#each brief.tags.slice(0, 6) as tag, tagIndex (tag + ':' + tagIndex)}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</a>
				{/each}
			{:else}
				<div class="article-empty">
					<p class="eyebrow">No matching briefs</p>
					<h2>Nothing matches the current filters.</h2>
					<p class="section-dek">Clear the search or tag filter to widen the list.</p>
				</div>
			{/if}
		</section>
	{/if}
{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Morning briefs · Microsoft sign-in required</p>
			<h1>Briefs stay behind the owner gate.</h1>
			<p class="dek">
				Sign in with Microsoft to open the private weekday focus notes. Only
				spice.ryan@hotmail.com can read this lane on the website.
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
					spice.ryan@hotmail.com. Use the footer button to switch accounts.
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
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls returnTo="/briefs/" />
</footer>
{#if authError}
	<p class="drafts-error" role="status">{authError}</p>
{/if}
