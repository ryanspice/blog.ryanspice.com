<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articleIndexHref } from '$lib/article-browse';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { devLogEntries, devLogMatchesArticleSlug, devLogMatchesTag, devLogTags } from '$lib/dev-log';

	const title = 'blog.ryanspice.com · Dev log';
	const description = 'A running log of site changes, AI Wiki notes, and the process hooks behind the blog.';
	const selectedTag = $derived(browser ? (page.url.searchParams.get('tag') ?? '').trim() : '');
	const selectedArticle = $derived(browser ? (page.url.searchParams.get('article') ?? '').trim() : '');
	const selectedView = $derived(browser ? (page.url.searchParams.get('view') ?? '').trim().toLowerCase() : '');
	const isCompactView = $derived(selectedView === 'compact');
	const filteredEntries = $derived(
		selectedTag || selectedArticle
			? devLogEntries.filter((entry) => {
					if (selectedTag && !devLogMatchesTag(entry, selectedTag)) return false;
					if (selectedArticle && !devLogMatchesArticleSlug(entry, selectedArticle)) return false;
					return true;
				})
			: devLogEntries
	);
	const featuredEntries = $derived(filteredEntries.slice(0, 3));
	const logEntries = $derived(filteredEntries.slice(3));
	const latestEntry = $derived(featuredEntries[0] ?? devLogEntries[0]);
	const selectedArticleLabel = $derived(selectedArticle ? selectedArticle.replaceAll('-', ' ') : '');

	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());

	function devLogTagHref(tag: string): string {
		const params = new URLSearchParams({ tag });
		return `${base}/dev-log/?${params.toString()}`;
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

	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"name": "blog.ryanspice.com · Dev log",
			"description": "A running log of site changes, AI Wiki notes, and the process hooks behind the blog.",
			"url": "https://blog.ryanspice.com/dev-log/"
		}
	</script>
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

{#if !isCompactView}
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
					<dd>{filteredEntries.length}</dd>
				</div>
				<div>
					<dt>Latest</dt>
					<dd><time datetime={latestEntry.date}>{latestEntry.dateLabel}</time></dd>
				</div>
				<div>
					<dt>Mode</dt>
					<dd>Weekday brief ready</dd>
				</div>
			</dl>
			{#if selectedTag || selectedArticle}
				<p class="dev-log-filter-note">
					Filtered by
					{#if selectedTag}<strong>{selectedTag}</strong>{/if}
					{#if selectedTag && selectedArticle}<span>and</span>{/if}
					{#if selectedArticle}<strong>{selectedArticleLabel}</strong>{/if}.
					<a href={`${base}/dev-log/`}>Clear filter</a>
				</p>
			{/if}
		</div>

		<aside
			class="hero-card home-hero-card"
			aria-label="Process hook"
			style={`--article-accent: ${latestEntry.accent}`}
		>
			<strong>Process hook</strong>
			<p>
				This page now accepts privacy-safe summaries from the weekday brief loop when a run finds
				enough signal to publish.
			</p>
			<dl class="hero-meta" aria-label="Dev log summary">
				<div>
					<dt>Source</dt>
					<dd>AI Wiki</dd>
				</div>
				<div>
					<dt>State</dt>
					<dd>Automated intake</dd>
				</div>
				<div>
					<dt>Scope</dt>
					<dd>Blog + project signals</dd>
				</div>
			</dl>
			<p class="home-hero-note">The point is traceability without exposing private source material.</p>
		</aside>
	</section>

	<section class="dev-log-tags" aria-label="Dev log tags">
		<div class="section-head compact-section-head">
			<p class="eyebrow">Search hooks</p>
			<h2>Dev-log tags</h2>
			<p class="section-dek">
				Tags connect process notes back to public article topics without exposing raw local evidence.
			</p>
		</div>

		<div class="tag-row compact">
			{#each devLogTags as tag, index (tag + ':' + index)}
				<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
			{/each}
		</div>
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
				<article id={featuredEntries[0].id} class="dev-log-card dev-log-card-large" style={`--article-accent: ${featuredEntries[0].accent}`}>
					<p class="dev-log-meta">
						<time datetime={featuredEntries[0].date}>{featuredEntries[0].dateLabel}</time>
						<span>{featuredEntries[0].source}</span>
					</p>
					<h2>{featuredEntries[0].title}</h2>
					<p>{featuredEntries[0].summary}</p>
					<div class="tag-row compact" aria-label="Entry tags">
						{#each featuredEntries[0].tags as tag, tagIndex (tag + ':' + tagIndex)}
							<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
						{/each}
					</div>
					<div class="tag-row compact" aria-label="Related article tags">
						{#each featuredEntries[0].relatedArticleTags as tag, tagIndex (tag + ':' + tagIndex)}
							<a class="tag tag-link" href={articleIndexHref({ view: 'compact', tag })}>{tag}</a>
						{/each}
					</div>
				</article>
			{/if}

			<div class="dev-log-featured-stack">
				{#each featuredEntries.slice(1) as entry, index (entry.date + ':' + entry.title + ':' + index)}
					<article id={entry.id} class="dev-log-card dev-log-card-small" style={`--article-accent: ${entry.accent}`}>
						<p class="dev-log-meta">
							<time datetime={entry.date}>{entry.dateLabel}</time>
							<span>{entry.source}</span>
						</p>
						<h3>{entry.title}</h3>
						<p>{entry.summary}</p>
						<div class="tag-row compact" aria-label="Entry tags">
							{#each entry.tags as tag, tagIndex (tag + ':' + tagIndex)}
								<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>
{/if}

<section class={`dev-log-feed${isCompactView ? ' dev-log-feed-compact' : ''}`} aria-label="Logs and events">
	<div class="section-head">
		<p class="eyebrow">Logs and events</p>
		<h2>Readable history</h2>
		<p class="section-dek">
			Short, human-readable entries that are easy to scan later.
		</p>
	</div>

	<ul class="dev-log-list">
		{#each logEntries as entry, index (entry.date + ':' + entry.title + ':' + index)}
			<li id={entry.id} class="dev-log-list-item" style={`--article-accent: ${entry.accent}`}>
				<div class="dev-log-list-meta">
					<time datetime={entry.date}>{entry.dateLabel}</time>
					<span>{entry.source}</span>
				</div>
				<div class="dev-log-list-body">
					<strong>{entry.title}</strong>
					<p>{entry.summary}</p>
					<div class="tag-row compact" aria-label="Entry tags">
						{#each entry.tags as tag, tagIndex (tag + ':' + tagIndex)}
							<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
						{/each}
					</div>
				</div>
			</li>
		{/each}
		{#if !filteredEntries.length}
			<li class="article-empty">
				<strong>No dev-log entries matched that tag.</strong>
				<p>Clear the filter or choose another process tag.</p>
			</li>
		{/if}
	</ul>
</section>

<footer>
	Seeded from AI Wiki notes and repo history. <a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">GitHub repo</a>.
	Future entries should stay privacy-scrubbed and taggable.
	<FooterAuthControls returnTo="/drafts/" />
</footer>
