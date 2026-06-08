<script lang="ts">
	import { base } from '$app/paths';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const copy = $derived(data.ui.rss);
	const navCopy = $derived(data.ui.nav);
	const title = $derived(copy.title);
	const description = $derived(copy.description);
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
			copyFeedback = copy.copied;
		} catch {
			const ok = fallbackCopyText(url);
			copyFeedback = ok ? copy.copied : copy.copyFailed;
		}
		setTimeout(() => { copyFeedback = ''; }, 2000);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content="noindex,follow" />
	<link rel="canonical" href={data.canonical} />
	{#each data.alternates as alternate (alternate.hreflang)}
		<link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
	{/each}
	<link rel="alternate" type="application/rss+xml" title={copy.channelTitle} href={data.feedUrl} />
</svelte:head>

<SiteHeader
	navLinks={[
		{ label: navCopy.articles, href: data.homeUrl + '#articles' },
		{ label: navCopy.devLog, href: '/dev-log/' },
		{ label: navCopy.rssXml, href: data.feedPath }
	]}
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
			<button type="button" onclick={copyFeedUrl}>{copyFeedback || copy.copyUrl}</button>
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
