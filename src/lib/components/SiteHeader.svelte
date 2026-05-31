<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { NavItem } from '$lib/articles';
	import { authState, canAccessDrafts, loadAuthState } from '$lib/auth';

	type Props = {
		brandLabel?: string;
		navLinks?: NavItem[];
	};

	let { brandLabel = 'Ryan Spice / Canopy Digital', navLinks = [] }: Props = $props();
	let readingMode = $state(false);

	onMount(() => {
		void loadAuthState();
	});

	const brandParts = $derived(
		brandLabel
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
	);

	const visibleNavLinks = $derived.by(() => {
		const merged = [...navLinks, { label: 'Dev log', href: '/dev-log' }];
		if (canAccessDrafts($authState)) {
			merged.push({ label: 'Drafts', href: '/drafts' });
		}
		return dedupeByHref(merged);
	});

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
	});

	function dedupeByHref(items: NavItem[]): NavItem[] {
		const seen = new Set<string>();
		return items.filter((item) => {
			const key = normalizeHrefForLinkDedup(item.href);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	function normalizeHrefForLinkDedup(href: string): string {
		if (!href || href === '/') return href;
		if (href.startsWith('http') || href.startsWith('#')) return href;
		return href.endsWith('/') ? href.slice(0, -1) : href;
	}
</script>

<header class="site-header">
	<nav class="nav" aria-label="Site">
		<div class="nav-branding">
			<a class="brand" href={`${base}/`}>
								<span class="brand-mark" aria-hidden="true"><span class="brand-mark-r">R</span><span class="brand-mark-s">S</span></span>
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

			<button
				class="nav-action"
				type="button"
				aria-pressed={readingMode}
				onclick={toggleReadingMode}
			>
				<svg class="nav-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
					<path
						d="M6 5.5h7.4c1.9 0 3.1 1.2 3.1 3.1V19a2.3 2.3 0 0 0-2.3-2.3H6.4A1.9 1.9 0 0 1 4.5 15V7a1.5 1.5 0 0 1 1.5-1.5Z"
						fill="currentColor"
						fill-opacity="0.14"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
					<path d="M12 7v10.5M8 8.4h2.4M8 11h2.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
				<span>{readingMode ? 'Reading on' : 'Reading mode'}</span>
			</button>
		</div>
	</nav>
</header>
