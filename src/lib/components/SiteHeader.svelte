<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { authLoginHref, authLogoutHref, authState, loadAuthState } from '$lib/auth';
	import type { NavItem } from '$lib/articles';

	type Props = {
		brandLabel?: string;
		navLinks?: NavItem[];
	};

	let { brandLabel = 'Ryan Spice / Canopy Digital', navLinks = [] }: Props = $props();
	const devLogLink: NavItem = { label: 'Dev log', href: '/dev-log' };
	const draftLink: NavItem = { label: 'Drafts', href: '/drafts' };
	const defaultNavLinks = [devLogLink];
	let readingMode = $state(false);

	const brandParts = $derived(
		brandLabel
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
	);
	const visibleNavLinks = $derived(
		[
			...navLinks,
			...defaultNavLinks.filter((item) => !navLinks.some((link) => link.href === item.href)),
			...($authState.authenticated ? [draftLink] : [])
		]
	);
	const loginHref = $derived($authState.authenticated ? authLogoutHref('/') : authLoginHref('/'));
	const loginLabel = $derived($authState.authenticated ? 'Logout' : 'Login');

	function hrefFor(href: string): string {
		if (href.startsWith('#') || href.startsWith('http')) return href;
		return `${base}${href}`;
	}

	function applyReadingMode(enabled: boolean): void {
		if (typeof document === 'undefined') return;
		document.documentElement.classList.toggle('reading-mode', enabled);
	}

	function toggleReadingMode(): void {
		readingMode = !readingMode;
		applyReadingMode(readingMode);
		window.localStorage.setItem('blog-reading-mode', String(readingMode));
	}

	onMount(() => {
		const stored = window.localStorage.getItem('blog-reading-mode');
		readingMode = stored === 'true';
		applyReadingMode(readingMode);
		void loadAuthState();
	});
</script>

<header class="site-header">
	<nav class="nav" aria-label="Site">
		<div class="nav-branding">
			<a class="brand" href={`${base}/`}>
				<span class="brand-mark" aria-hidden="true"></span>
				<span class="brand-text">
					<span class="brand-primary">{brandParts[0] ?? brandLabel}</span>
					{#if brandParts[1]}
						<span class="brand-secondary">{brandParts[1]}</span>
					{/if}
				</span>
			</a>
		</div>

		<div class="nav-cluster">
			{#if visibleNavLinks.length}
				<div class="nav-links">
					{#each visibleNavLinks as item (item.href)}
						<a href={hrefFor(item.href)}>{item.label}</a>
					{/each}
				</div>
			{/if}

			<div class="nav-actions" aria-label="Site actions">
				<button
					class="nav-action"
					type="button"
					aria-pressed={readingMode}
					onclick={toggleReadingMode}
				>
					{readingMode ? 'Reading on' : 'Reading mode'}
				</button>
				<a class="nav-action nav-auth" href={loginHref}>{loginLabel}</a>
			</div>
		</div>
	</nav>
</header>
