<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { consumeAuthReturnTo, loadAuthState } from '$lib/auth';

	let status = $state('Completing Microsoft sign-in…');
	let error = $state('');

	onMount(async () => {
		try {
			await loadAuthState();
			status = 'Signed in. Returning to the site…';
			await goto(consumeAuthReturnTo('/'));
		} catch (caught) {
			error = caught instanceof Error ? caught.message : String(caught);
			status = 'Sign-in callback failed.';
		}
	});
</script>

<svelte:head>
	<title>Signing in · blog.ryanspice.com</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="callback-shell">
	<section class="callback-card" aria-live="polite">
		<p class="eyebrow">Microsoft auth callback</p>
		<h1>{status}</h1>
		{#if error}
			<p class="drafts-error">{error}</p>
			<a class="plain-action" href="/">Back to home</a>
		{/if}
	</section>
</main>

<style>
	.callback-shell {
		display: grid;
		min-height: 100vh;
		place-items: center;
		padding: 2rem;
	}

	.callback-card {
		width: min(34rem, 100%);
		border: 1px solid var(--metro-line-soft);
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.03);
		padding: 2rem;
	}

	.callback-card h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.5rem);
		line-height: 0.95;
	}

	.plain-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 14px;
		margin-top: 12px;
		border: 1px solid var(--metro-line-soft);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.03);
		color: var(--text);
		text-decoration: none;
	}
</style>
