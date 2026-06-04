<script lang="ts">
	import { base } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'RSS feed · blog.ryanspice.com';
	const description = 'Human-friendly RSS feed page for blog.ryanspice.com.';
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
			This page is the readable version of the feed. The real RSS document stays at
			<a href={data.feedUrl}>/rss.xml</a>.
		</p>

		<div class="home-hero-links">
			<a href={data.feedUrl}>Open RSS XML</a>
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
