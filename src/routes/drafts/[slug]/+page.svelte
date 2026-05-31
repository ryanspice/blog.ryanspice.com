<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, canAccessDrafts, loadAuthState, signIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { Article } from '$lib/articles';

	type Props = {
		data: {
			slug: string;
		};
	};

	let { data }: Props = $props();
	let article = $state<Article | null>(null);
	let loadError = $state<string | null>(null);
	let articleLoading = $state(true);
	let signingIn = $state(false);
	const canViewDrafts = $derived(canAccessDrafts($authState));

	const title = $derived(article ? `${article.title} · Draft · blog.ryanspice.com` : 'blog.ryanspice.com · Draft');
	const description = $derived(article?.summary ?? 'Private draft article preview from Ryan Spice.');
	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());

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
			const auth = await loadAuthState();
			if (!auth.authenticated) {
				articleLoading = false;
				return;
			}

			const module = await import('$lib/articles');
			article = module.getArticle(data.slug) ?? null;
			if (!article || article.status === 'published') {
				loadError = 'Draft not found';
			}
			articleLoading = false;
		} catch (error_) {
			loadError = error_ instanceof Error ? error_.message : 'Unable to load draft';
			articleLoading = false;
		}
	});

	async function handleSignIn() {
		signingIn = true;

		try {
			await signIn(`/drafts/${data.slug}/`);
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

{#if canViewDrafts}
	{#if articleLoading}
		<SiteHeader navLinks={[{ label: 'Drafts', href: '/drafts' }, { label: 'RSS', href: '/rss.xml' }]} />
		<section class="home-hero compact-page">
			<div class="home-hero-copy">
				<p class="eyebrow">Private draft preview · loading article</p>
				<h1>Opening the draft preview.</h1>
				<p class="dek">The auth gate is open; the article content is loading from the workspace.</p>
			</div>
			<aside class="hero-card home-hero-card">
				<strong>Loading preview</strong>
				<p>Pulling the draft article into view.</p>
			</aside>
		</section>
	{:else if article}
		<ArticleView {article} />
	{:else}
		<SiteHeader navLinks={[{ label: 'Drafts', href: '/drafts' }, { label: 'RSS', href: '/rss.xml' }]} />
		<section class="article-grid" aria-label="Draft error">
			<div class="article-empty">
				<p class="eyebrow">Draft unavailable</p>
				<h2>{loadError ?? 'Unable to load the draft.'}</h2>
				<p class="section-dek">
					The draft may have been promoted, renamed, or is not available in this workspace.
				</p>
			</div>
		</section>
	{/if}
{:else}
	<SiteHeader navLinks={[{ label: 'Drafts', href: '/drafts' }, { label: 'RSS', href: '/rss.xml' }]} />
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Private draft preview · Microsoft sign-in required</p>
			<h1>This draft stays behind the gate.</h1>
			<p class="dek">
				Sign in to open the draft preview. The public homepage does not surface this content.
				Only spice.ryan@hotmail.com can open drafts.
			</p>
		</div>
		<aside class="hero-card home-hero-card">
			<strong>{ $authState.loading ? 'Checking access' : 'Sign in' }</strong>
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
				{#if $authState.loading}
					Hold on while the auth gate responds.
				{:else if $authState.authenticated && !$authState.draftsAllowed}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but drafts are reserved for
					spice.ryan@hotmail.com.
				{:else}
					The drafts preview is private even though the route exists in the static build.
				{/if}
			</p>
		</aside>
	</section>
{/if}

{#if articleLoading || !article}
	<footer class="drafts-footer">
		<FooterAuthControls returnTo={`/drafts/${data.slug}/`} />
	</footer>
{/if}

