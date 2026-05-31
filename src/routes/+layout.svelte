<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadAuthState } from '$lib/auth';
	import '../app.css';

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

	let { children } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href={`${base}/tower-accent.php`} />
	<link rel="alternate" type="application/rss+xml" title="Ryan Spice · Technical notes" href={`${base}/rss.xml`} />
</svelte:head>

<div class="site-shell">
	{@render children()}
</div>
