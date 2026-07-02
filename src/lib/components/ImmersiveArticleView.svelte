<script lang="ts">
	import { base } from '$app/paths';
	import { articleTagIndexHref, type ArticleIndexStatus } from '$lib/article-browse';
	import { articleAccentColor } from '$lib/article-accent';
	import { articleHref } from '$lib/article-links';
	import type { Article } from '$lib/articles';
	import type { DevLogEntry } from '$lib/dev-log';
	import type { TocItem } from '$lib/markdown';
	import ArticleIcon from '$lib/components/ArticleIcon.svelte';
	import FooterAuthControls from '$lib/components/FooterAuthControls.svelte';
	import SafeHtml from '$lib/components/SafeHtml.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	type Props = {
		article: Article;
		relatedArticles?: Article[];
		relatedDevLogEntries?: DevLogEntry[];
		progress: number;
		activeTocId: string | null;
		articleAccent: string;
		previewTransitionName: string;
		titleTransitionName: string;
		articleInfo: string;
		articleReferences: string[];
		commandFeedback: string | null;
		copyLink: () => Promise<void>;
		formatReferenceLabel: (value: string) => string;
		devLogArticleHref: (entry?: DevLogEntry) => string;
		devLogTagHref: (tag: string) => string;
		devLogSignalTags: (entry: DevLogEntry) => string[];
	};

	let {
		article,
		relatedArticles = [],
		relatedDevLogEntries = [],
		progress,
		activeTocId,
		articleAccent,
		previewTransitionName,
		titleTransitionName,
		articleInfo,
		articleReferences,
		commandFeedback,
		copyLink,
		formatReferenceLabel,
		devLogArticleHref,
		devLogTagHref,
		devLogSignalTags
	}: Props = $props();

	const articleFooterLinks = [
		{ label: 'Home', href: `${base}/` },
		{ label: 'RSS', href: `${base}/rss.xml` },
		{ label: 'GitHub repo', href: 'https://github.com/ryanspice/blog.ryanspice.com' },
		{ label: 'Dev log', href: `${base}/dev-log/` }
	];
	const statusItems = $derived(article.design.statusItems.slice(0, 4));
	const keySignals = $derived(
		(article.design.railChips?.length ? article.design.railChips : article.tags).slice(0, 4)
	);
	const firstTocItems = $derived(article.toc.filter((item) => item.level === 2).slice(0, 4));
	const heroImagePath = '/img/articles/how-chatgpt-performs-deep-research/chatgpt-deep-research-vs-deepseek';
	const hasComparisonHero = $derived(article.slug === 'how-chatgpt-performs-deep-research');
	const primaryVisual = $derived(article.visuals?.focal ?? article.visuals?.background ?? null);
	const backgroundVisual = $derived(article.visuals?.background ?? article.visuals?.focal ?? null);
	const backgroundImageCss = $derived(backgroundVisual ? `url("${backgroundVisual.src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")` : '');
	const pageStyle = $derived(
		[
			`--article-accent: ${articleAccent}`,
			backgroundImageCss ? `--article-background-image: ${backgroundImageCss}` : '',
			backgroundVisual?.position ? `--article-background-position: ${backgroundVisual.position}` : ''
		]
			.filter(Boolean)
			.join('; ')
	);

	function tocHref(item: TocItem): string {
		return `#${item.id}`;
	}
</script>

<div
	class={`article-page immersive-article-page theme-${article.design.variant} has-command-bar`}
	class:has-article-background={Boolean(backgroundVisual)}
	style={pageStyle}
>
	<div class="read-progress" style={`width: ${progress}%`}></div>

	<aside class="immersive-rail" aria-label="Article tools">
		<a class="immersive-rail-mark" href={`${base}/`} aria-label="Ryan Spice home">
			<span>RS</span>
		</a>
		<nav class="immersive-rail-nav" aria-label="Article shortcuts">
			<a href="#top" aria-label="Overview">
				<ArticleIcon name="articles" />
				<span>Overview</span>
			</a>
			<a href="#sections" aria-label="Sections">
				<ArticleIcon name="latest" />
				<span>Sections</span>
			</a>
			<a href={article.toc[0] ? tocHref(article.toc[0]) : '#article'} aria-label="Highlights">
				<ArticleIcon name="research" />
				<span>Highlights</span>
			</a>
			<button type="button" onclick={copyLink} aria-label="Copy article link">
				<ArticleIcon name="feed" />
				<span>Share</span>
			</button>
			<a href="#about-article" aria-label="About this article">
				<ArticleIcon name="compare" />
				<span>About</span>
			</a>
		</nav>
	</aside>

	<div class="immersive-main" id="top">
		<SiteHeader brandLabel={article.design.brandLabel} navLinks={article.design.navLinks} />

		<section class="immersive-hero" aria-labelledby="article-title">
			<div class="immersive-hero-copy" style:view-transition-name={previewTransitionName}>
				<p class="eyebrow">{article.design.eyebrow}</p>
				<h1 id="article-title" style:view-transition-name={titleTransitionName}>{article.title}</h1>
				<p class="dek">{article.summary}</p>

				<dl class="immersive-meta-grid" aria-label="Article metadata">
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
					<div>
						<dt>Updated</dt>
						<dd><time datetime={article.updatedDate}>{article.updatedDateLabel}</time></dd>
					</div>
				</dl>

				<div class="tag-row immersive-tags" aria-label="Tags">
					{#each article.design.tags as tag, index (tag + ':' + index)}
						<a class="tag tag-link" href={articleTagIndexHref(tag, article.status as ArticleIndexStatus)}>{tag}</a>
					{/each}
				</div>
			</div>

			<div class="immersive-hero-media" aria-hidden="true">
				{#if primaryVisual}
					<img
						src={primaryVisual.src}
						alt=""
						loading="eager"
						decoding="async"
						style={`object-position: ${primaryVisual.position ?? 'center center'}`}
					/>
				{:else if hasComparisonHero}
					<picture>
						<source
							type="image/webp"
							srcset={`${base}${heroImagePath}-900w.webp 900w, ${base}${heroImagePath}-1200w.webp 1200w, ${base}${heroImagePath}-1600w.webp 1600w`}
							sizes="(min-width: 1180px) 520px, calc(100vw - 32px)"
						/>
						<img
							src={`${base}${heroImagePath}-1200w.jpg`}
							srcset={`${base}${heroImagePath}-900w.jpg 900w, ${base}${heroImagePath}-1200w.jpg 1200w, ${base}${heroImagePath}-1600w.jpg 1600w`}
							sizes="(min-width: 1180px) 520px, calc(100vw - 32px)"
							alt=""
							loading="eager"
							decoding="async"
						/>
					</picture>
				{:else}
					<div class="immersive-abstract-visual">
						<div class="visual-cube cube-a">{article.design.tags[0] ?? 'AI'}</div>
						<div class="visual-vs">VS</div>
						<div class="visual-cube cube-b">{article.design.tags[1] ?? 'UX'}</div>
					</div>
				{/if}
			</div>

			<div class="immersive-hero-panels">
				<aside class="immersive-panel" aria-label={article.design.heroCardAria}>
					<p class="panel-kicker">{article.design.heroCardTitle}</p>
					<div class="glance-table">
						{#each statusItems as item, index (item.label + ':' + index)}
							<div>
								<span>{item.label}</span>
								<strong>{item.value}</strong>
							</div>
						{/each}
					</div>
				</aside>

				<aside class="immersive-panel" aria-label="Read this article your way">
					<p class="panel-title">Read this article your way</p>
					<div class="read-options">
						{#each firstTocItems as item, index (item.id + ':' + index)}
							<a href={tocHref(item)} class:is-active={activeTocId === item.id}>
								<span>{index + 1}</span>
								<strong>{item.text}</strong>
							</a>
						{/each}
						<a href="#article">
							<span>All</span>
							<strong>Deep dive</strong>
						</a>
					</div>
				</aside>
			</div>
		</section>

		<section class="immersive-big-picture" aria-label="Article summary">
			<div class="immersive-panel summary-panel">
				<h2>The big picture</h2>
				<SafeHtml as="p" html={article.design.railBodyHtml} />
				<div class="signal-grid">
					{#each keySignals as signal, index (signal + ':' + index)}
						<div>
							<ArticleIcon name={index % 2 === 0 ? 'research' : 'compare'} />
							<strong>{signal}</strong>
							<span>{index === 0 ? article.draftType.replaceAll('-', ' ') : article.tags[index] ?? 'article signal'}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<main id="sections" class="immersive-layout">
			{#if article.toc.length}
				<aside class="immersive-toc article-toc article-toc--desktop" aria-label="Table of contents">
					<h2>{article.design.tocTitle}</h2>
					{#each article.toc as item, index (item.id + ':' + index)}
						<a
							class:toc-l3={item.level === 3}
							class:toc-l2={item.level === 2}
							class:is-active={activeTocId === item.id}
							href={tocHref(item)}
							>{item.text}</a
						>
					{/each}
				</aside>
			{/if}

			<div class="immersive-article-column">
				<article id="article" class="immersive-article-shell">
					<SafeHtml class="article-inner immersive-article-inner" html={article.html} />
				</article>

				{#if articleReferences.length}
					<section class="article-references immersive-references" aria-label="Sources and further reading">
						<div class="section-head">
							<p class="eyebrow">Sources</p>
							<h2>Sources and further reading</h2>
							<p class="section-dek">
								External documentation and source material linked for the parts of the article that need it.
							</p>
						</div>

						<ul class="reference-list">
							{#each articleReferences as reference, index (reference + ':' + index)}
								<li>
									<a class="wiki-link external-link" href={reference} rel="noreferrer" target="_blank">
										{formatReferenceLabel(reference)}
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if relatedDevLogEntries.length}
					<section class="article-dev-log immersive-dev-log" aria-label="Article dev log">
						<div class="section-head">
							<p class="eyebrow">Dev log</p>
							<h2>How this got made</h2>
							<p class="section-dek">
								Public process notes linked to this article's research, implementation, and publishing tags.
							</p>
						</div>

						<div class="article-dev-log-grid">
							{#each relatedDevLogEntries as entry, index (entry.id + ':' + index)}
								<article class="article-dev-log-card" style={`--article-accent: ${entry.accent}`}>
									<p class="dev-log-meta">
										<time datetime={entry.date}>{entry.dateLabel}</time>
										<span>{entry.source}</span>
									</p>
									<h3><a href={devLogArticleHref(entry)}>{entry.title}</a></h3>
									<p>{entry.summary}</p>
									<div class="tag-row compact" aria-label={`${entry.title} research tags`}>
										{#each devLogSignalTags(entry) as tag, tagIndex (tag + ':' + tagIndex)}
											<a class="tag tag-link" href={devLogTagHref(tag)}>{tag}</a>
										{/each}
									</div>
								</article>
							{/each}
						</div>

						<a class="process-trail-link" href={devLogArticleHref()}>View filtered public dev log</a>
					</section>
				{/if}

				{#if relatedArticles.length}
					<section class="related-articles immersive-related" aria-label="Related articles">
						<div class="section-head">
							<p class="eyebrow">Related articles</p>
							<h2>More like this</h2>
						</div>

						<div class="related-articles-grid">
							{#each relatedArticles as related, index (related.slug + ':' + index)}
								<a
									class="related-article-card article-card-link"
									href={articleHref(related)}
									style={`--article-accent: ${articleAccentColor(related)}`}
								>
									<p class="related-kicker">{related.draftType.replaceAll('-', ' ')}</p>
									<h3>{related.title}</h3>
									<p class="related-meta">
										<time datetime={related.date}>{related.dateLabel}</time>
										<span>{related.readingMinutes} min read</span>
									</p>
									<p>{related.summary}</p>
								</a>
							{/each}
						</div>
					</section>
				{/if}
			</div>
		</main>

		<section id="about-article" class="immersive-about immersive-panel" aria-label="About this article">
			<strong>Keep in mind</strong>
			<SafeHtml as="p" html={article.design.railCalloutHtml} />
			<span>{articleInfo}</span>
		</section>

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

		<footer class="article-footer">
			<p class="article-footer-copy">{article.design.footerText}</p>
			<div class="article-footer-links" aria-label="Footer links">
				{#each articleFooterLinks as link, index (link.href + ':' + index)}
					<a href={link.href}>{link.label}</a>
				{/each}
				<FooterAuthControls returnTo="/drafts/" />
			</div>
		</footer>
	</div>
</div>
