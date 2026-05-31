<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { devLogEntries } from '$lib/dev-log';

	const title = 'blog.ryanspice.com · Dev log';
	const description = 'A running log of site changes, AI Wiki notes, and the process hooks behind the blog.';
	const featuredEntries = devLogEntries.slice(0, 3);
	const logEntries = devLogEntries.slice(3);
	const latestEntry = featuredEntries[0];

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
			A small running history of site changes, AI Wiki notes, and the process hooks behind the
			blog.
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
				<dt>Mode</dt>
				<dd>Manual for now</dd>
			</div>
		</dl>
	</div>

	<aside
		class="hero-card home-hero-card"
		aria-label="Process hook"
		style={`--article-accent: ${latestEntry.accent}`}
	>
		<strong>Process hook</strong>
		<p>
			This starts as a manual page. Later, it can accept a compact command-layer summary or other
			repo-generated note.
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
		<p class="home-hero-note">The point is traceability without turning the page into a taxonomy.</p>
	</aside>
</section>

<section class="dev-log-featured" aria-label="Working notes">
	<div class="section-head">
		<p class="eyebrow">Working notes</p>
		<h2>Latest changes</h2>
		<p class="section-dek">
			The newest note gets the most space. The two before it stay visible without taking over the
			page.
		</p>
	</div>

	<div class="dev-log-featured-grid">
		{#if featuredEntries[0]}
			<article class="dev-log-card dev-log-card-large" style={`--article-accent: ${featuredEntries[0].accent}`}>
				<p class="dev-log-meta">
					<time datetime={featuredEntries[0].date}>{featuredEntries[0].dateLabel}</time>
					<span>{featuredEntries[0].source}</span>
				</p>
				<h2>{featuredEntries[0].title}</h2>
				<p>{featuredEntries[0].summary}</p>
			</article>
		{/if}

		<div class="dev-log-featured-stack">
			{#each featuredEntries.slice(1) as entry (entry.date + entry.title)}
				<article class="dev-log-card dev-log-card-small" style={`--article-accent: ${entry.accent}`}>
					<p class="dev-log-meta">
						<time datetime={entry.date}>{entry.dateLabel}</time>
						<span>{entry.source}</span>
					</p>
					<h3>{entry.title}</h3>
					<p>{entry.summary}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="dev-log-feed" aria-label="Logs and events">
	<div class="section-head">
		<p class="eyebrow">Logs and events</p>
		<h2>Readable history</h2>
		<p class="section-dek">
			Short, human-readable entries that are easy to scan later.
		</p>
	</div>

	<ul class="dev-log-list">
		{#each logEntries as entry (entry.date + entry.title)}
			<li class="dev-log-list-item" style={`--article-accent: ${entry.accent}`}>
				<div class="dev-log-list-meta">
					<time datetime={entry.date}>{entry.dateLabel}</time>
					<span>{entry.source}</span>
				</div>
				<div class="dev-log-list-body">
					<strong>{entry.title}</strong>
					<p>{entry.summary}</p>
				</div>
			</li>
		{/each}
	</ul>
</section>

<footer>
	Seeded from AI Wiki notes and repo history. <a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">GitHub repo</a>.
	Future hook: wire a command-layer summary export into this page when it becomes worth automating.
	<FooterAuthControls returnTo="/drafts/" />
</footer>
