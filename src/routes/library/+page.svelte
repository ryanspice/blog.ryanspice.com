<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import ResearchLibraryCard from '$lib/components/ResearchLibraryCard.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	const title = 'blog.ryanspice.com · Research library';
	const description = 'Research papers, technical references, and source material used across the blog.';
	let { data }: { data: PageData } = $props();
	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());
	const libraryItems = $derived(data.libraryItems ?? []);
	const paperCount = $derived(data.paperCount ?? libraryItems.filter((item) => item.sourceType === 'paper').length);
	const researchDomains = $derived(data.researchDomains ?? []);
	const sourceTypes = $derived(data.sourceTypes ?? []);
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': ['WebPage', 'CollectionPage'],
				'@id': `${canonical}#webpage`,
				name: title,
				description,
				url: canonical,
				isPartOf: {
					'@type': 'Blog',
					name: 'blog.ryanspice.com',
					url: page.url.origin
				},
				about: libraryItems.map((item) => item.title)
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Articles',
						item: page.url.origin
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: 'Research library',
						item: canonical
					}
				]
			}
		]
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
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	{@html `<script type="application/ld+json">${jsonLdEscaped}</${'script'}>`}
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: 'Articles', href: '/#articles' },
		{ label: 'Dev log', href: '/dev-log' },
		{ label: 'RSS', href: '/rss.xml' }
	]}
/>

<section class="home-hero">
	<div class="home-hero-copy">
		<p class="eyebrow">Research shelf · source memory</p>
		<h1>Library of papers, references, and source material used by the blog.</h1>
		<p class="dek">
			This page keeps the research layer visible: rendering papers, official docs, sailing references,
			and AI-workflow sources that posts can cite without burying the trail in a private chat.
		</p>
		<dl class="meta-grid home-meta" aria-label="Research library metadata">
			<div>
				<dt>Sources</dt>
				<dd>{libraryItems.length}</dd>
			</div>
			<div>
				<dt>Papers</dt>
				<dd>{paperCount}</dd>
			</div>
			<div>
				<dt>Domains</dt>
				<dd>{researchDomains.length}</dd>
			</div>
		</dl>
	</div>

	<aside class="hero-card home-hero-card" aria-label="Library framing" style="--article-accent: #00aeef">
		<strong>Why this exists</strong>
		<p>
			The blog increasingly uses deep research, local demos, and AI Wiki notes. The library is the
			public index of the sources that keep those posts grounded.
		</p>
		<dl class="hero-meta" aria-label="Library summary">
			<div><dt>Mode</dt><dd>Curated</dd></div>
			<div><dt>Scope</dt><dd>Blog research</dd></div>
			<div><dt>Update path</dt><dd>Manual for now</dd></div>
		</dl>
	</aside>
</section>

<section class="article-grid" aria-label="Research library items">
	<div class="section-head">
		<p class="eyebrow">Sources</p>
		<h2>Research shelf</h2>
		<p class="section-dek">
			Each item shows what kind of source it is, where it was used, and why it matters.
		</p>
	</div>

	{#each libraryItems as item, index (item.url + ':' + index)}
		<ResearchLibraryCard {item} />
	{/each}
</section>

<section class="dev-log-feed" aria-label="Library taxonomy">
	<div class="section-head">
		<p class="eyebrow">Taxonomy</p>
		<h2>Current source types and domains</h2>
		<p class="section-dek">Small enough to stay readable; structured enough to keep expanding.</p>
	</div>

	<ul class="dev-log-list">
		<li class="dev-log-list-item" style="--article-accent: #00aeef">
			<div class="dev-log-list-meta"><span>Types</span></div>
			<div class="dev-log-list-body"><strong>{sourceTypes.join(', ')}</strong></div>
		</li>
		<li class="dev-log-list-item" style="--article-accent: #00aeef">
			<div class="dev-log-list-meta"><span>Domains</span></div>
			<div class="dev-log-list-body"><strong>{researchDomains.join(', ')}</strong></div>
		</li>
	</ul>
</section>

<footer>
	Research library for blog.ryanspice.com. <a href="https://github.com/ryanspice/blog.ryanspice.com" rel="noreferrer" target="_blank">GitHub repo</a>.
	<FooterAuthControls returnTo="/drafts/" />
</footer>
