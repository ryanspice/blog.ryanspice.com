<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadAuthState } from '$lib/auth';
	import { pathWithLocale } from '$lib/i18n/locales';
	import '../app.css';
	import '../article-polish.css';
	import '../canopy-theme.css';

	onNavigate((navigation) => {
		if (typeof document.startViewTransition !== 'function') return;

		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		void loadAuthState();
	});

	let { children, data } = $props();
	const siteTheme = $derived(data?.site?.themeClass ?? 'ryan');
	const rssAlternateTitle = $derived(data?.rssAlternateTitle ?? data?.ui?.rss?.channelTitle ?? 'Ryan Spice Blog RSS');
	const rssAlternateHref = $derived(data?.rssUrl ?? `${base}${pathWithLocale(data?.locale ?? 'en', '/rss.xml')}`);

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (data?.languageTag) document.documentElement.lang = data.languageTag;
			document.documentElement.dataset.site = siteTheme;
		}
	});
</script>

<svelte:head>
	{#if siteTheme === 'canopy'}
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
		<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Serif+JP:wght@500;700&display=swap" />
	{/if}
	<link rel="icon" type="image/svg+xml" href={`${base}/favicon.svg`} />
	<link rel="stylesheet" href={`${base}/tower-accent.css`} />
	<link rel="alternate" type="application/rss+xml" title={rssAlternateTitle} href={rssAlternateHref} />
</svelte:head>

<div class={`site-shell site-shell--${siteTheme}`}>
	{@render children()}
</div>
