<script lang="ts">
	import { afterNavigate, invalidateAll, onNavigate } from '$app/navigation';
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

	afterNavigate((navigation) => {
		if (navigation.type === 'enter') return;
		void invalidateAll();
	});

	onMount(() => {
		void loadAuthState();
	});

	let { children, data } = $props();
	const siteTheme = $derived(data?.site?.themeClass ?? 'ryan');

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
		<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700&display=swap" />
	{/if}
	<link rel="stylesheet" href={`${base}/tower-accent.css`} />
	<link rel="alternate" type="application/rss+xml" title={data?.ui?.rss?.channelTitle ?? 'Ryan Spice · Technical notes'} href={`${base}${pathWithLocale(data?.locale ?? 'en', '/rss.xml')}`} />
</svelte:head>

<div class={`site-shell site-shell--${siteTheme}`}>
	{@render children()}
</div>
