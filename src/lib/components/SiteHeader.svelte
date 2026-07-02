<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import type { NavItem } from '$lib/articles';
	import { authState, canAccessDrafts, loadAuthState } from '$lib/auth';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { pathWithLocale, type SupportedLocale } from '$lib/i18n/locales';

	type Props = {
		brandLabel?: string;
		brandInitials?: string;
		navLinks?: NavItem[];
		showLibraryLink?: boolean;
		showDevLogLink?: boolean;
		showOwnerLinks?: boolean;
	};

	let {
		brandLabel = 'Ryan Spice / Canopy Digital',
		brandInitials = 'RS',
		navLinks = [],
		showLibraryLink = true,
		showDevLogLink = true,
		showOwnerLinks = true
	}: Props = $props();
	let authInitialized = $state(false);
	const locale = $derived((page.data.locale === 'fr' ? 'fr' : 'en') as SupportedLocale);
	const ui = $derived(getDictionary(locale));
	const initials = $derived((brandInitials.trim().slice(0, 2).toUpperCase() || 'RS').padEnd(2, ' '));

	$effect(() => {
		if (authInitialized) return;
		authInitialized = true;
		void loadAuthState();
	});

	const brandParts = $derived(
		brandLabel
			.split('/')
			.map((part) => part.trim())
			.filter(Boolean)
	);

	const visibleNavLinks = $derived.by(() => {
		const merged = [...navLinks];
		if (showLibraryLink) merged.push({ label: ui.nav.library, href: '/library' });
		if (showDevLogLink) merged.push({ label: ui.nav.devLog, href: '/dev-log' });
		if (showOwnerLinks && canAccessDrafts($authState)) {
			merged.push({ label: ui.nav.briefs, href: '/briefs' });
			merged.push({ label: ui.nav.drafts, href: '/drafts' });
		}
		return dedupeByHref(merged);
	});

	function hrefFor(href: string): string {
		if (href.startsWith('#') || href.startsWith('http')) return href;
		return `${base}${href}`;
	}

	function dedupeByHref(items: NavItem[]): NavItem[] {
		const seen: string[] = [];
		return items.filter((item) => {
			const key = normalizeHrefForLinkDedup(item.href);
			if (seen.includes(key)) return false;
			seen.push(key);
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
			<a class="brand" href={`${base}${pathWithLocale(locale, '/')}`}>
				<span class="brand-mark" aria-hidden="true"><span class="brand-mark-r">{initials[0]}</span><span class="brand-mark-s">{initials[1]}</span></span>
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
					{#each visibleNavLinks as item, index (item.href + ':' + index)}
						<a href={hrefFor(item.href)}>{item.label}</a>
					{/each}
				</div>
			{/if}

			<button
				class="nav-action"
				type="button"
				aria-pressed="false"
				data-reading-mode-toggle
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
				<span data-reading-mode-label data-label-on={ui.nav.readingOn} data-label-off={ui.nav.readingMode}>{ui.nav.readingMode}</span>
			</button>
		</div>
	</nav>
</header>
