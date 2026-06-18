<script lang="ts">
	import { base } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { siteConfigs } from '$lib/site-config';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const copy = $derived(data.ui.rss);
	const navCopy = $derived(data.ui.nav);
	const site = $derived(data.site ?? siteConfigs.ryan);
	const title = $derived(copy.title);
	const description = $derived(copy.description);
	const ogImage = $derived(new URL(`${base}/og-default.png`, data.canonical).toString());
	const headerLinks = $derived.by(() => {
		const links = [
			{ label: navCopy.articles, href: data.homeUrl + '#articles' },
			{ label: navCopy.rssXml, href: data.feedPath }
		];
		if (site.showDevLogLinks) links.splice(1, 0, { label: navCopy.devLog, href: '/dev-log/' });
		return links;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={data.canonical} />
	{#each data.alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<link rel="alternate" type="application/rss+xml" title={copy.channelTitle} href={data.feedUrl} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={data.canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.siteName} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={title} />
</svelte:head>

<SiteHeader
	brandLabel={site.brandLabel}
	brandInitials={site.brandInitials}
	showLibraryLink={site.showLibraryLinks}
	showDevLogLink={site.showDevLogLinks}
	showOwnerLinks={site.showOwnerControls}
	navLinks={headerLinks}
/>

<main class="rss-friendly-shell">
	<section class="rss-friendly-hero">
		<p class="eyebrow">{copy.feedLabel}</p>
		<h1>{copy.heading}</h1>
		<p class="dek">
			{copy.readerDek}
			<code>{data.feedUrl}</code>.
		</p>

		<div class="home-hero-links">
			<a href={data.feedUrl}>{copy.openXml}</a>
			<button type="button" data-copy-text={data.feedUrl} data-copy-success={copy.copied} data-copy-failure={copy.copyFailed}>{copy.copyUrl}</button>
			<a href={data.homeUrl}>{copy.backToArticles}</a>
		</div>
	</section>

	<section class="rss-friendly-list" aria-label={copy.latestItems}>
		<div class="section-head">
			<p class="eyebrow">{copy.latestItems}</p>
			<h2>{copy.recentEntries}</h2>
			<p class="section-dek">{copy.recentEntriesDek}</p>
		</div>

		<div class="rss-friendly-items">
			{#each data.latestArticles as article (article.slug)}
				<a class="rss-friendly-item" href={`${base}${article.href}`}>
					<p class="dev-log-meta">
						<time datetime={article.date}>{article.dateLabel}</time>
						<span>{article.readingMinutes} {data.ui.article.minRead}</span>
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
