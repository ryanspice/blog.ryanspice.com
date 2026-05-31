<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, loadAuthState, signIn, signOut } from '$lib/auth';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	const title = 'blog.ryanspice.com · Login';
	const description = 'Microsoft sign-in for the private draft queue on blog.ryanspice.com.';
	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const signInLabel = $derived($authState.loading ? 'Checking session…' : 'Sign in with Microsoft');

	let returnTo = $state('/drafts/');
	let logoutRequested = $state(false);
	let signing = $state(false);
	let signOutInFlight = $state(false);
	let actionError = $state('');

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url: canonical
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	onMount(() => {
		let cancelled = false;
		const params = new URLSearchParams(window.location.search);
		returnTo = sanitizeReturnTo(params.get('returnTo'), '/drafts/');
		logoutRequested = params.get('logout') === '1';

		void loadAuthState().then(async (state) => {
			if (cancelled) return;

			if (logoutRequested && state.authenticated) {
				signOutInFlight = true;
				actionError = '';

				try {
					await signOut();
				} catch (caught) {
					if (!cancelled) {
						actionError = caught instanceof Error ? caught.message : String(caught);
					}
				} finally {
					if (!cancelled) {
						signOutInFlight = false;
					}
				}
			}
		});

		return () => {
			cancelled = true;
		};
	});

	async function handleSignIn() {
		signing = true;
		actionError = '';

		try {
			await signIn(returnTo);
		} catch (caught) {
			actionError = caught instanceof Error ? caught.message : String(caught);
		} finally {
			signing = false;
		}
	}

	async function handleSignOut() {
		signOutInFlight = true;
		actionError = '';

		try {
			await signOut();
		} catch (caught) {
			actionError = caught instanceof Error ? caught.message : String(caught);
		} finally {
			signOutInFlight = false;
		}
	}

	function sanitizeReturnTo(value: string | null, fallback: string): string {
		const target = (value ?? '').trim();
		if (!target) return fallback;
		if (!target.startsWith('/')) return fallback;
		if (target.startsWith('//')) return fallback;
		return target;
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

<SiteHeader navLinks={[{ label: 'Articles', href: '/#articles' }, { label: 'RSS', href: '/rss.xml' }]} />

<section class="home-hero compact-page">
	<div class="home-hero-copy">
		<p class="eyebrow">Microsoft auth gate</p>
		<h1>Sign in to open the private draft queue.</h1>
		<p class="dek">
			This route uses Microsoft Entra / MSAL browser auth. Register a single-page application in
			Microsoft Entra and point the redirect URI at <code>/auth/callback</code>.
		</p>
		<dl class="meta-grid home-meta" aria-label="Login metadata">
			<div>
				<dt>Provider</dt>
				<dd>Microsoft Entra</dd>
			</div>
			<div>
				<dt>Scope</dt>
				<dd>User.Read</dd>
			</div>
			<div>
				<dt>Post-login</dt>
				<dd>{returnTo}</dd>
			</div>
		</dl>
	</div>

	<aside class="hero-card home-hero-card" aria-label="Login actions">
		<strong>Sign in</strong>
		{#if $authState.loading}
			<p>Checking the current session.</p>
		{:else if $authState.authenticated}
			<p>
				You are already signed in as {$authState.userName ?? 'a Microsoft account'}.
				{#if $authState.draftsAllowed}
					This account can open drafts.
				{:else}
					Drafts are reserved for spice.ryan@hotmail.com.
				{/if}
			</p>
			<div class="home-hero-links">
				{#if $authState.draftsAllowed}
					<a href={returnTo}>Open drafts</a>
				{:else}
					<button type="button" class="plain-action" onclick={handleSignIn} disabled={signing || !$authState.available}>
						{signing ? 'Opening Microsoft…' : 'Try another account'}
					</button>
				{/if}
				<button type="button" class="plain-action" onclick={handleSignOut} disabled={signOutInFlight}>
					{signOutInFlight ? 'Signing out…' : 'Sign out'}
				</button>
			</div>
		{:else}
			<p>Use any Microsoft account to enter the draft queue.</p>
			<div class="home-hero-links">
				<button
					type="button"
					class="plain-action"
					onclick={handleSignIn}
					disabled={signing || !$authState.available}
				>
					{signing ? 'Opening Microsoft…' : signInLabel}
				</button>
				<a href={returnTo}>Open drafts</a>
			</div>
		{/if}
		<p class="home-hero-note">
			{#if actionError}
				{actionError}
			{:else if !$authState.available}
				{$authState.error ?? 'Microsoft sign-in is not configured for this build yet.'}
			{:else if logoutRequested && signOutInFlight}
				Signing out of Microsoft…
			{:else}
				The redirect callback lives at <code>/auth/callback</code> and returns to the page you
				requested.
			{/if}
		</p>
	</aside>
</section>

<style>
	.plain-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 14px;
		border: 1px solid var(--metro-line-soft);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.03);
		color: var(--text);
		cursor: pointer;
		font-family: inherit;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
	}

	.plain-action:disabled {
		cursor: wait;
		opacity: 0.68;
	}
</style>


