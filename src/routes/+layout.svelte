<script lang="ts">
	import { afterNavigate, invalidateAll, onNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadAuthState } from '$lib/auth';
	import { pathWithLocale } from '$lib/i18n/locales';
	import '../app.css';
	import '../article-polish.css';

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

	$effect(() => {
		if (typeof document !== 'undefined' && data?.languageTag) {
			document.documentElement.lang = data.languageTag;
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href={`${base}/tower-accent.css`} />
	<link rel="alternate" type="application/rss+xml" title={data?.ui?.rss?.channelTitle ?? 'Ryan Spice · Technical notes'} href={`${base}${pathWithLocale(data?.locale ?? 'en', '/rss.xml')}`} />
</svelte:head>

<div class="site-shell">
	{@render children()}
</div>
