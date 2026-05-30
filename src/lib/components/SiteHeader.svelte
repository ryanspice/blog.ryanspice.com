<script lang="ts">
	import { base } from '$app/paths';
	import type { NavItem } from '$lib/articles';

	type Props = {
		brandLabel?: string;
		navLinks?: NavItem[];
	};

	let { brandLabel = 'Ryan Spice / Canopy Digital', navLinks = [] }: Props = $props();

	const brandParts = $derived(
		brandLabel
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
	);

	function hrefFor(href: string): string {
		if (href.startsWith('#') || href.startsWith('http')) return href;
		return `${base}${href}`;
	}
</script>

<header class="site-header">
	<nav class="nav" aria-label="Site">
		<a class="brand" href={`${base}/`}>
			<span class="brand-mark" aria-hidden="true"></span>
			<span class="brand-text">
				<span class="brand-primary">{brandParts[0] ?? brandLabel}</span>
				{#if brandParts[1]}
					<span class="brand-secondary">{brandParts[1]}</span>
				{/if}
			</span>
		</a>
		{#if navLinks.length}
			<div class="nav-links">
				{#each navLinks as item}
					<a href={hrefFor(item.href)}>{item.label}</a>
				{/each}
			</div>
		{/if}
	</nav>
</header>
