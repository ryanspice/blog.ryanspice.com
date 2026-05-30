<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { devLogEntries } from '$lib/dev-log';

	const title = 'blog.ryanspice.com · Dev log';
	const description =
		'A running log of AI Wiki fragments, site changes, and the process hooks behind the blog.';
	const latestEntry = devLogEntries[0];

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: title,
		description,
		url: canonical
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	function hrefFor(href: string): string {
		if (href.startsWith('#') || href.startsWith('http')) return href;
		return `${base}${href}`;
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="blog.ryanspice.com" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={title} />

	{@html `<script type="application/ld+json">${jsonLdEscaped}</script>`}
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

<section class="home-hero">
	<div class="home-hero-copy">
		<p class="eyebrow">AI Wiki · blog process</p>
		<h1>Dev log for the blog and the work that feeds it.</h1>
		<p class="dek">
			A loose bridge between the public site, AI Wiki fragments, and the small implementation
			decisions that make the rest of the blog move.
		</p>
		<dl class="meta-grid home-meta" aria-label="Dev log metadata">
			<div>
				<dt>Entries</dt>
				<dd>{devLogEntries.length}</dd>
			</div>
			<div>
				<dt>Latest</dt>
				<dd><time datetime={latestEntry.date}>{latestEntry.dateLabel}</time></dd>
			</div>
			<div>
				<dt>Hook</dt>
				<dd>Manual for now</dd>
			</div>
		</dl>
	</div>

	<aside
		class="hero-card home-hero-card"
		aria-label="Fragment tie-in"
		style={`--article-accent: ${latestEntry.accent}`}
	>
		<strong>Fragment tie-in</strong>
		<p>
			This page starts as a lightweight manual log. Later, it can accept a command summary or an
			AI Wiki fragment export instead of a hand-edited list.
		</p>
		<dl class="hero-meta" aria-label="Dev log summary">
			<div>
				<dt>Source</dt>
				<dd>AI Wiki</dd>
			</div>
			<div>
				<dt>State</dt>
				<dd>Prototype</dd>
			</div>
			<div>
				<dt>Scope</dt>
				<dd>Blog + drafts</dd>
			</div>
		</dl>
		<p class="home-hero-note">The point is traceability, not ceremony.</p>
	</aside>
</section>

<section class="article-grid" aria-label="Dev log entries">
	<div class="section-head">
		<p class="eyebrow">Working notes</p>
		<h2>What changed and why</h2>
		<p class="section-dek">
			Small entries that connect the site, the AI Wiki, and the content pipeline behind the
			published posts.
		</p>
	</div>

	{#each devLogEntries as entry (entry.date + entry.title)}
		<article class="article-card dev-log-entry" style={`--article-accent: ${entry.accent}`}>
			<p class="card-kicker">{entry.fragment}</p>
			<h2>{entry.title}</h2>
			<div class="card-meta" aria-label="Entry metadata">
				<time datetime={entry.date}>{entry.dateLabel}</time>
				<span>{entry.source}</span>
			</div>
			<p>{entry.summary}</p>
			<div class="tag-row compact" aria-label="Tags">
				{#each entry.tags as tag (tag)}
					<span class="tag">{tag}</span>
				{/each}
			</div>
			{#if entry.links?.length}
				<div class="home-hero-links" aria-label={`Related links for ${entry.title}`}>
					{#each entry.links as link (link.href)}
						<a href={hrefFor(link.href)}>{link.label}</a>
					{/each}
				</div>
			{/if}
		</article>
	{/each}
</section>

<footer>
	Seeded from AI Wiki fragments and repo notes. Future hook: wire a command-layer summary export
	into this page when the process is worth automating.
</footer>
