<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'RSS feed · blog.ryanspice.com';
	const description = 'Human-friendly RSS feed page for blog.ryanspice.com.';
	let copyFeedback = $state('');

	function fallbackCopyText(text: string): boolean {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.left = '-9999px';
		textarea.style.top = '0';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		try { return document.execCommand('copy'); }
		catch { return false; }
		finally { document.body.removeChild(textarea); }
	}

	async function copyFeedUrl() {
		const url = data.feedUrl;
		try {
			await navigator.clipboard.writeText(url);
			copyFeedback = 'Copied';
		} catch {
			const ok = fallbackCopyText(url);
			copyFeedback = ok ? 'Copied' : 'Copy failed';
		}
		setTimeout(() => { copyFeedback = ''; }, 2000);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content="noindex,follow" />
	<link rel="canonical" href={data.canonical} />
	<link rel="alternate" type="application/rss+xml" title="Ryan Spice technical notes" href={data.feedUrl} />
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'Dev log', href: '/dev-log/' },
		{ label: 'RSS XML', href: '/rss.xml' }
	]}
/>

<main class="rss-friendly-shell">
	<section class="rss-friendly-hero">
		<p class="eyebrow">RSS feed</p>
		<h1>Subscribe to the technical notes feed.</h1>
		<p class="dek">
			This page is the readable version of the feed. The raw RSS XML is at
			<code>{data.feedUrl}</code>.
		</p>

		<div class="home-hero-links">
			<a href={data.feedUrl}>Open RSS XML</a>
			<button type="button" onclick={copyFeedUrl}>{copyFeedback || 'Copy feed URL'}</button>
			<a href={`${base}/`}>Back to articles</a>
		</div>
	</section>

	<section class="rss-friendly-list" aria-label="Latest feed items">
		<div class="section-head">
			<p class="eyebrow">Latest items</p>
			<h2>Recent feed entries</h2>
			<p class="section-dek">The feed includes the latest published public articles.</p>
		</div>

		<div class="rss-friendly-items">
			{#each data.latestArticles as article (article.slug)}
				<a class="rss-friendly-item" href={`${base}/${article.slug}/`}>
					<p class="dev-log-meta">
						<time datetime={article.date}>{article.dateLabel}</time>
						<span>{article.readingMinutes} min read</span>
					</p>
					<h2>{article.title}</h2>
					<p>{article.summary}</p>
					<div class="tag-row compact" aria-label="Tags">
						{#each article.tags as tag (tag)}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</a>
			{/each}
		</div>
	</section>
</main>
