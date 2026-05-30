<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { articleTagIndexHref, type ArticleIndexStatus } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { getRelatedArticles, type Article } from '$lib/articles';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { articlePreviewTransitionName, articleTitleTransitionName } from '$lib/view-transitions';

	type Props = {
		article: Article;
	};

	let { article }: Props = $props();
	let progress = $state(0);
	let activeTocId = $state<string | null>(null);
	let commandFeedback = $state<string | null>(null);
	let feedbackTimer: number | null = null;
	const articleAccent = $derived(articleAccentColor(article));
	const relatedArticles = $derived(getRelatedArticles(article, 3));
	const previewTransitionName = $derived(articlePreviewTransitionName(article.slug));
	const titleTransitionName = $derived(articleTitleTransitionName(article.slug));

	const pageTitle = $derived(`${article.title} · blog.ryanspice.com`);
	const description = $derived(article.summary || 'Technical blog drafts and production notes from Ryan Spice.');
	const canonical = $derived(new URL(page.url.pathname, page.url.origin).toString());
	const rssUrl = $derived(new URL(`${base}/rss.xml`, page.url.origin).toString());
	const ogImage = $derived(new URL(`${base}/og-default.png`, page.url.origin).toString());

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Home',
						item: new URL(`${base}/`, page.url.origin).toString()
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: article.title,
						item: canonical
					}
				]
			},
			{
				'@type': 'BlogPosting',
				headline: article.title,
				description,
				mainEntityOfPage: canonical,
				datePublished: article.date,
				dateModified: article.date,
				author: {
					'@type': 'Person',
					name: 'Ryan Spice',
					url: new URL(`${base}/`, page.url.origin).toString()
				},
				keywords: article.tags.join(', '),
				wordCount: article.wordCount,
				timeRequired: `PT${article.readingMinutes}M`
			}
		]
	});
	const jsonLdEscaped = $derived(JSON.stringify(jsonLd).replace(/</g, '\\u003c'));

	function setCommandFeedback(message: string) {
		commandFeedback = message;
		if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
		feedbackTimer = window.setTimeout(() => {
			commandFeedback = null;
		}, 1600);
	}

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
		try {
			return document.execCommand('copy');
		} catch {
			return false;
		} finally {
			document.body.removeChild(textarea);
		}
	}

	async function copyLink() {
		const text = canonical;

		try {
			await navigator.clipboard.writeText(text);
			setCommandFeedback('Link copied');
			return;
		} catch {
			// fall through
		}

		const ok = fallbackCopyText(text);
		setCommandFeedback(ok ? 'Link copied' : 'Copy failed');
	}

	async function enhanceMermaid() {
		const diagrams = Array.from(document.querySelectorAll<HTMLElement>('.mermaid-diagram'));
		if (!diagrams.length) return;

		try {
			const { default: mermaid } = await import('mermaid');
			mermaid.initialize({
				startOnLoad: false,
				securityLevel: 'strict',
				theme: 'dark',
				darkMode: true
			});

			for (const [index, diagram] of diagrams.entries()) {
				const source = diagram.textContent?.trim();
				if (!source) continue;

				try {
					const renderId = `mermaid-${article.slug}-${index}`;
					const { svg } = await mermaid.render(renderId, source);
					diagram.innerHTML = svg;
					diagram.classList.add('mermaid-ready');
				} catch {
					diagram.classList.add('mermaid-error');
				}
			}
		} catch {
			for (const diagram of diagrams) {
				diagram.classList.add('mermaid-error');
			}
		}
	}

	onMount(() => {
		const headings = Array.from(
			document.querySelectorAll<HTMLElement>('.article-inner h2[id], .article-inner h3[id]')
		);

		let frame: number | null = null;

		const update = () => {
			if (frame !== null) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const height = document.documentElement.scrollHeight - window.innerHeight;
			progress = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;

				if (headings.length) {
					const offset = 140;
					let current: string | null = headings[0]?.id ?? null;
					for (const heading of headings) {
						const top = heading.getBoundingClientRect().top;
						if (top - offset <= 0) current = heading.id;
						else break;
					}
					if (current !== activeTocId) activeTocId = current;
				}
			});
		};

		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		void enhanceMermaid();
		return () => {
			if (frame !== null) cancelAnimationFrame(frame);
			if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="blog.ryanspice.com" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={pageTitle} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={pageTitle} />

	<link rel="alternate" type="application/rss+xml" title="RSS" href={rssUrl} />

	<meta property="article:published_time" content={article.date} />
	<meta property="article:modified_time" content={article.date} />

	{#each article.tags as tag (tag)}
		<meta property="article:tag" content={tag} />
	{/each}

	{@html `<script type="application/ld+json">${jsonLdEscaped}</script>`}
</svelte:head>

<div class={`article-page theme-${article.design.variant} has-command-bar`} style={`--article-accent: ${articleAccent}`}>
	<div class="read-progress" style={`width: ${progress}%`}></div>

	<SiteHeader brandLabel={article.design.brandLabel} navLinks={article.design.navLinks} />

	<section class="hero">
		<aside class="toc article-toc" aria-label="Table of contents">
			<h2>{article.design.tocTitle}</h2>
			{#each article.toc as item (item.id)}
				<a
					class:toc-l3={item.level === 3}
					class:toc-l2={item.level === 2}
					class:is-active={activeTocId === item.id}
					href={`#${item.id}`}
					>{item.text}</a
				>
			{/each}
		</aside>

		<div class="article-hero-copy" style:view-transition-name={previewTransitionName}>
			<div class="eyebrow">{article.design.eyebrow}</div>
			<h1 style:view-transition-name={titleTransitionName}>{article.title}</h1>
			<dl class="meta-grid article-meta" aria-label="Article metadata">
				<div>
					<dt>Published</dt>
					<dd><time datetime={article.date}>{article.dateLabel}</time></dd>
				</div>
				<div>
					<dt>Read time</dt>
					<dd>{article.readingMinutes} min</dd>
				</div>
				<div>
					<dt>Type</dt>
					<dd>{article.draftType.replaceAll('-', ' ')}</dd>
				</div>
			</dl>
			<p class="dek">{article.summary}</p>
			<div class="tag-row" aria-label="Tags">
				{#each article.design.tags as tag (tag)}
					<a class="tag tag-link" href={articleTagIndexHref(tag, article.status as ArticleIndexStatus)}>{tag}</a>
				{/each}
			</div>
		</div>

		<aside class="hero-card" aria-label={article.design.heroCardAria} style={`--article-accent: ${articleAccent}`}>
			<strong>{article.design.heroCardTitle}</strong>
			<div class="status-grid">
				{#each article.design.statusItems as item (item.label)}
					<div class="status-pill"><span>{item.label}</span><strong>{item.value}</strong></div>
				{/each}
			</div>
		</aside>
	</section>

	{#if relatedArticles.length}
		<section class="related-articles" aria-label="Related articles">
			<div class="section-head">
				<p class="eyebrow">Related articles</p>
				<h2>More like this</h2>
				<p class="section-dek">
					Articles with overlapping tags, explicit references, or the same line of work.
				</p>
			</div>

			<div class="related-articles-grid">
				{#each relatedArticles as related (related.slug)}
					<a
						class="related-article-card article-card-link"
						href={`${base}/${related.slug}/`}
						style={`--article-accent: ${articleAccentColor(related)}`}
					>
						<p class="related-kicker">{related.draftType.replaceAll('-', ' ')}</p>
						<h3>{related.title}</h3>
						<p class="related-meta">
							<time datetime={related.date}>{related.dateLabel}</time>
							<span>{related.readingMinutes} min read</span>
						</p>
						<p>{related.summary}</p>
						<div class="tag-row compact" aria-label={`${related.title} tags`}>
							{#each related.tags.slice(0, 4) as tag (tag)}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<main class="layout">
		<article class="article-shell">
			<div class="article-inner">
				{@html article.html}
			</div>
		</article>

		<aside class="rail-card" aria-label="Design notes">
			<h2>{article.design.railTitle}</h2>
			<p>{@html article.design.railBodyHtml}</p>

			{#if article.design.railPalette}
				<div class="palette-preview" aria-label={article.design.railPalette.label}>
					{#each article.design.railPalette.colors as color (color)}
						<span class="swatch" style={`background:${color}`}></span>
					{/each}
				</div>
			{/if}

			{#if article.design.railChips?.length}
				<div class="debug-stack" aria-label={article.design.railChipsLabel ?? 'Debugging stack'}>
					{#each article.design.railChips as chip (chip)}
						<span class="debug-chip">{chip}</span>
					{/each}
				</div>
			{/if}

			<div class="callout">
				{@html article.design.railCalloutHtml}
			</div>
		</aside>
	</main>

	<div class="command-bar" aria-label="Commands">
		<div class="command-inner">
			<a class="cmd" href={`${base}/`}>Back</a>
			<a class="cmd" href={`${base}/rss.xml`}>RSS</a>
			<button class="cmd" type="button" onclick={copyLink} aria-label="Copy link to clipboard">
				Copy link
			</button>
			{#if commandFeedback}
				<span class="cmd-feedback" aria-live="polite">{commandFeedback}</span>
			{/if}
		</div>
	</div>

	<footer>
		{article.design.footerText}
	</footer>
</div>
