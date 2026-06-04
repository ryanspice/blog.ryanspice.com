<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { authState, canAccessDrafts, loadAuthState, signIn } from '$lib/auth';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { MorningBrief } from '$lib/morning-briefs';

	type Props = {
		data: {
			slug: string;
		};
	};

	let { data }: Props = $props();
	let brief = $state<MorningBrief | null>(null);
	let loadError = $state<string | null>(null);
	let briefLoading = $state(true);
	let signingIn = $state(false);

	const canViewBriefs = $derived(canAccessDrafts($authState));
	const title = $derived(brief ? `${brief.title} · Morning Brief · blog.ryanspice.com` : 'blog.ryanspice.com · Morning Brief');
	const description = $derived(brief?.summary ?? 'Private morning brief for Ryan Spice.');
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
				briefLoading = false;
				return;
			}

			const module = await import('$lib/morning-briefs');
			brief = module.getMorningBrief(data.slug) ?? null;
			if (!brief || brief.status === 'archived') {
				loadError = 'Morning brief not found';
			}
			briefLoading = false;
		} catch (error_) {
			loadError = error_ instanceof Error ? error_.message : 'Unable to load morning brief';
			briefLoading = false;
		}
	});

	async function handleSignIn() {
		signingIn = true;

		try {
			await signIn(`/briefs/${data.slug}/`);
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
		{ label: 'Briefs', href: '/briefs' },
		{ label: 'Dev log', href: '/dev-log' },
		{ label: 'Drafts', href: '/drafts' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

{#if canViewBriefs}
	{#if briefLoading}
		<section class="home-hero compact-page">
			<div class="home-hero-copy">
				<p class="eyebrow">Private morning brief · loading</p>
				<h1>Opening the brief.</h1>
				<p class="dek">The owner gate is open; the brief content is loading.</p>
			</div>
		</section>
	{:else if brief}
		<section class="home-hero compact-page private-brief-hero">
			<div class="home-hero-copy">
				<p class="eyebrow">Morning brief · owner only</p>
				<h1>{brief.title}</h1>
				<p class="dek">{brief.summary}</p>
				<dl class="meta-grid home-meta" aria-label="Brief metadata">
					<div>
						<dt>Date</dt>
						<dd><time datetime={brief.date}>{brief.dateLabel}</time></dd>
					</div>
					<div>
						<dt>Read time</dt>
						<dd>{brief.readingMinutes} min</dd>
					</div>
					<div>
						<dt>Status</dt>
						<dd>{brief.status}</dd>
					</div>
				</dl>
				<div class="tag-row" aria-label="Brief tags">
					{#each brief.tags as tag, index (tag + ':' + index)}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>

			<aside class="hero-card home-hero-card" aria-label="Privacy notes">
				<strong>Private website lane</strong>
				<p>
					This content is readable in the site UI only after the owner Microsoft account passes the
					auth check. Keep every brief sanitized before adding it here.
				</p>
				<a class="plain-action" href={`${base}/briefs/`}>Back to briefs</a>
			</aside>
		</section>

		<main class="layout private-brief-layout">
			<aside class="toc article-toc article-toc--desktop" aria-label="Brief contents">
				<h2>Contents</h2>
				{#each brief.toc as item, index (item.id + ':' + index)}
					<a class:toc-l3={item.level === 3} href={`#${item.id}`}>{item.text}</a>
				{/each}
			</aside>

			<article class="article-shell">
				<div class="article-inner private-brief-inner">
					{@html brief.html}
				</div>
			</article>
		</main>
	{:else}
		<section class="article-grid" aria-label="Morning brief error">
			<div class="article-empty">
				<p class="eyebrow">Brief unavailable</p>
				<h2>{loadError ?? 'Unable to load the brief.'}</h2>
				<p class="section-dek">The brief may have been renamed, archived, or removed from this build.</p>
			</div>
		</section>
	{/if}
{:else}
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Private morning brief · Microsoft sign-in required</p>
			<h1>This brief stays behind the owner gate.</h1>
			<p class="dek">
				Sign in to open the private brief. Only spice.ryan@hotmail.com can read morning briefs on
				the website.
			</p>
		</div>
		<aside class="hero-card home-hero-card">
			<strong>{ $authState.loading ? 'Checking access' : 'Sign in' }</strong>
			<div class="home-hero-links">
				<button type="button" class="plain-action" onclick={handleSignIn} disabled={signingIn || !$authState.available}>
					{signingIn
						? 'Opening Microsoft...'
						: $authState.authenticated && !$authState.draftsAllowed
							? 'Try another account'
							: 'Sign in with Microsoft'}
				</button>
			</div>
			<p class="home-hero-note">
				{#if $authState.loading}
					Hold on while the auth gate responds.
				{:else if $authState.authenticated && !$authState.draftsAllowed}
					Signed in as {$authState.userEmail ?? 'a Microsoft account'}, but briefs are reserved for
					spice.ryan@hotmail.com.
				{:else}
					The route exists in the static build, but the brief body is loaded only after the owner gate.
				{/if}
			</p>
		</aside>
	</section>
{/if}

<footer class="drafts-footer">
	<FooterAuthControls returnTo={`/briefs/${data.slug}/`} />
</footer>
