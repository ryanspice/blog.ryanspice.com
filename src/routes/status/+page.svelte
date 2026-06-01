<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, canAccessDrafts, getMsalClient, loadAuthState, signIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	const title = 'blog.ryanspice.com · Status';
	const description = 'Build, content, and deploy status snapshot for blog.ryanspice.com.';

	let { data }: { data: PageData } = $props();

	let authResolved = $state(false);
	let signingIn = $state(false);
	let authConnections = $state<number | null>(null);

	type LiveStatus = {
		ok: boolean;
		serverTimeUtc?: string;
		releases?: { count: number; latest?: string | null };
		backups?: { count: number; latest?: string | null; totalBytes?: number };
		error?: string;
	};

	let liveStatus = $state<LiveStatus | null>(null);
	let liveLoading = $state(false);
	let liveError = $state<string | null>(null);

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(data.ogImage);
	const canViewDrafts = $derived(canAccessDrafts($authState));
	const liveEndpoint = $derived(`${base}/status.live.json`);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url: canonical
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	onMount(async () => {
		try {
			const state = await loadAuthState();
			if (!state.available) {
				authConnections = 0;
				return;
			}

			const client = await getMsalClient();
			authConnections = client.getAllAccounts().length;
		} catch {
			authConnections = null;
		} finally {
			authResolved = true;
		}
	});

	onMount(async () => {
		liveLoading = true;
		liveError = null;

		try {
			const response = await fetch(liveEndpoint, { cache: 'no-store' });
			if (!response.ok) {
				throw new Error(`Live status unavailable (${response.status})`);
			}
			liveStatus = (await response.json()) as LiveStatus;
		} catch (error_) {
			liveError = error_ instanceof Error ? error_.message : 'Unable to load live status';
		} finally {
			liveLoading = false;
		}
	});

	async function handleSignIn() {
		signingIn = true;
		try {
			await signIn('/status/');
		} finally {
			signingIn = false;
		}
	}

	function formatBytes(value: number | undefined): string {
		if (!value || value <= 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		let size = value;
		let i = 0;
		while (size >= 1024 && i < units.length - 1) {
			size /= 1024;
			i += 1;
		}
		return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
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
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

<section class="home-hero compact-page">
	<div class="home-hero-copy">
		<p class="eyebrow">Site status · internal snapshot</p>
		<h1>Status page for the blog build and deploy buckets.</h1>
		<p class="dek">
			This is a thin diagnostic view: content counts from the build plus live counts for
			<code>_releases</code> and <code>_backups</code> when available on PHP hosting.
		</p>
		<dl class="meta-grid home-meta" aria-label="Build status summary">
			<div>
				<dt>Pages</dt>
				<dd>{data.pages.total}</dd>
			</div>
			<div>
				<dt>Connections</dt>
				<dd>{authConnections === null ? 'n/a' : authConnections}</dd>
			</div>
			<div>
				<dt>Releases</dt>
				<dd>{liveStatus?.releases?.count ?? 'n/a'}</dd>
			</div>
			<div>
				<dt>Backups</dt>
				<dd>{liveStatus?.backups?.count ?? 'n/a'}</dd>
			</div>
		</dl>
	</div>

	<aside class="hero-card home-hero-card" aria-label="Build metadata">
		<strong>Build metadata</strong>
		<dl class="hero-meta" aria-label="Build metadata details">
			<div>
				<dt>App</dt>
				<dd>{data.build.name}</dd>
			</div>
			<div>
				<dt>Version</dt>
				<dd>{data.build.version}</dd>
			</div>
			<div>
				<dt>SvelteKit</dt>
				<dd>{data.build.svelteKit}</dd>
			</div>
		</dl>
		<p class="home-hero-note">This page is intentionally <code>noindex</code>.</p>
	</aside>
</section>

{#if canViewDrafts}
	<section class="article-grid" aria-label="Live deploy buckets">
		<div class="section-head">
			<p class="eyebrow">Deploy buckets</p>
			<h2>Releases and backups</h2>
			<p class="section-dek">
				Counts come from the live PHP filesystem when the endpoint is available.
			</p>
		</div>

		<div class="article-empty" style="text-align:left">
			{#if liveLoading}
				<p class="eyebrow">Loading live status</p>
				<h2>Checking <code>_releases</code> and <code>_backups</code>…</h2>
				<p class="section-dek">Requesting <code>{liveEndpoint}</code>.</p>
			{:else if liveError}
				<p class="eyebrow">Live status unavailable</p>
				<h2>Could not load deploy bucket counts.</h2>
				<p class="section-dek">{liveError}</p>
			{:else if liveStatus?.ok}
				<p class="eyebrow">Live snapshot</p>
				<h2>Deploy buckets on the host</h2>
				<dl class="meta-grid home-meta" aria-label="Deploy bucket counts">
					<div>
						<dt>Releases</dt>
						<dd>{liveStatus.releases?.count ?? 0}</dd>
					</div>
					<div>
						<dt>Backups</dt>
						<dd>{liveStatus.backups?.count ?? 0}</dd>
					</div>
					<div>
						<dt>Backup size</dt>
						<dd>{formatBytes(liveStatus.backups?.totalBytes)}</dd>
					</div>
				</dl>
				<p class="section-dek">
					Latest release: <code>{liveStatus.releases?.latest ?? 'n/a'}</code><br />
					Latest backup: <code>{liveStatus.backups?.latest ?? 'n/a'}</code><br />
					Server time (UTC): <code>{liveStatus.serverTimeUtc ?? 'n/a'}</code>
				</p>
			{:else}
				<p class="eyebrow">Live status unknown</p>
				<h2>No live bucket data returned.</h2>
				<p class="section-dek">
					The endpoint might not exist in this environment, or the host might deny access.
				</p>
			{/if}
		</div>
	</section>
{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Status · restricted</p>
			<h2>Sign in to view deploy bucket counts.</h2>
			<p class="dek">
				Content counts remain visible, but host bucket details are reserved for the owner account.
			</p>
			<dl class="meta-grid home-meta" aria-label="Auth gate metadata">
				<div>
					<dt>Gate</dt>
					<dd>{authResolved ? 'Locked' : 'Checking'}</dd>
				</div>
				<div>
					<dt>Provider</dt>
					<dd>Microsoft Entra</dd>
				</div>
				<div>
					<dt>Access</dt>
					<dd>Owner only</dd>
				</div>
			</dl>
		</div>

		<aside class="hero-card home-hero-card" aria-label="Status access">
			<strong>Status access</strong>
			<p>
				{#if $authState.loading}
					Hold on while the auth gate responds.
				{:else if $authState.authenticated && !$authState.draftsAllowed}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but status access is reserved
					for spice.ryan@hotmail.com.
				{:else}
					Sign in to view deploy bucket counts and release/backups metadata.
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
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls returnTo="/status/" />
</footer>
