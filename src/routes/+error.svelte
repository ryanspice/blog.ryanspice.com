<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'The requested page could not be loaded.');
</script>

<svelte:head>
	<title>{status} · blog.ryanspice.com</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader navLinks={[{ label: 'Articles', href: '/#articles' }, { label: 'RSS', href: '/rss.xml' }]} />

<main class="error-shell">
	<section class="home-hero compact-page">
		<div class="home-hero-copy">
			<p class="eyebrow">Site error</p>
			<h1>{status}</h1>
			<p class="dek">{message}</p>
			<div class="home-hero-links">
				<a href="/">Back to articles</a>
			</div>
		</div>
	</section>
</main>
