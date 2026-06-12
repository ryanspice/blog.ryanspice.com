<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import ArticleView from '$lib/components/ArticleView.svelte';
	import { getArticle, getRelatedArticles, type Article, type ArticleDesign } from '$lib/articles';
	import ArticleDiffView from '$lib/components/ArticleDiffView.svelte';

	let { data } = $props();

	let isDiff = $state(false);

	$effect(() => {
		if (browser) {
			isDiff = page.url.searchParams.get('diff') === 'true';
		}
	});

	const fallbackArticle = $derived.by(() => getArticle(page.params.slug ?? ''));
	const sourceArticle = $derived.by(() => hasUsefulArticle(data.article) ? data.article : fallbackArticle);
	const safeArticle = $derived(toSafeArticle(sourceArticle));
	const sourceRelatedArticles = $derived.by(() => {
		const related = Array.isArray(data.relatedArticles) ? data.relatedArticles.filter(Boolean) : [];
		if (related.length) return related;
		return fallbackArticle ? getRelatedArticles(fallbackArticle, 3) : [];
	});
	const safeRelatedArticles = $derived(sourceRelatedArticles.map(toSafeArticle));
	const safeAlternates = $derived(Array.isArray(data.alternates) ? data.alternates : []);

	function hasUsefulArticle(value: unknown): boolean {
		const article = toObject(value);
		return Boolean(
			toString(article.slug) &&
			toString(article.title) &&
			(toString(article.html) || toString(article.body) || toString(article.summary))
		);
	}

	function toObject(value: unknown): Record<string, unknown> {
		return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	}

	function toString(value: unknown, fallback = ''): string {
		return typeof value === 'string' && value.trim() ? value : fallback;
	}

	function toNumber(value: unknown, fallback = 0): number {
		return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
	}

	function toStringArray(value: unknown): string[] {
		return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
	}

	function toSafeDesign(value: unknown, article: Record<string, unknown>): ArticleDesign {
		const design = toObject(value);
		const status = toString(article.status, 'published');
		const draftType = toString(article.draftType, 'technical-blog-post');
		const dateLabel = toString(article.dateLabel, 'Recent');
		const updatedDateLabel = toString(article.updatedDateLabel, dateLabel);
		const designTags = toStringArray(design.tags);
		const articleTags = toStringArray(article.tags);
		const tags = designTags.length ? designTags : articleTags;
		const variant = toString(design.variant);

		return {
			variant: ['repair', 'debug', 'default'].includes(variant) ? (variant as ArticleDesign['variant']) : 'default',
			brandLabel: toString(design.brandLabel, 'Ryan Spice / Canopy Digital'),
			navLinks: Array.isArray(design.navLinks) ? (design.navLinks as ArticleDesign['navLinks']) : [{ label: 'Articles', href: '/#articles' }],
			eyebrow: toString(design.eyebrow, `Technical blog · ${status}`),
			tags,
			accent: toString(design.accent, 'var(--accent)'),
			cardPalette: design.cardPalette as ArticleDesign['cardPalette'],
			heroCardTitle: toString(design.heroCardTitle, 'Article profile'),
			heroCardAria: toString(design.heroCardAria, 'Article details'),
			statusItems: Array.isArray(design.statusItems)
				? (design.statusItems as ArticleDesign['statusItems'])
				: [
						{ label: 'Type', value: draftType.replaceAll('-', ' ') },
						{ label: 'Status', value: status },
						{ label: 'Date', value: dateLabel }
					],
			tocTitle: toString(design.tocTitle, 'Contents'),
			railTitle: toString(design.railTitle, 'Publishing notes'),
			railBodyHtml: toString(design.railBodyHtml, 'This route is static-friendly and generated from local Markdown.'),
			railStatusItems: design.railStatusItems as ArticleDesign['railStatusItems'],
			railPalette: design.railPalette as ArticleDesign['railPalette'],
			railChips: design.railChips as ArticleDesign['railChips'],
			railChipsLabel: design.railChipsLabel as ArticleDesign['railChipsLabel'],
			railCalloutHtml: toString(design.railCalloutHtml, '<strong>Note:</strong> Article metadata was normalized for hydration.'),
			footerText: toString(design.footerText, `Updated last ${updatedDateLabel} · Static SvelteKit article generated from local Markdown.`)
		};
	}

	function toSafeArticle(value: unknown): Article {
		const article = toObject(value);
		const title = toString(article.title, 'Article');
		const slug = toString(article.slug, page.params.slug ?? 'article');
		const status = toString(article.status, 'published');
		const draftType = toString(article.draftType, 'technical-blog-post');
		const date = toString(article.date, '2026-05-28');
		const dateLabel = toString(article.dateLabel, 'Recent');
		const updatedDate = toString(article.updatedDate, date);
		const updatedDateLabel = toString(article.updatedDateLabel, dateLabel);
		const tags = toStringArray(article.tags);

		return {
			...(article as Partial<Article>),
			title,
			slug,
			locale: (article.locale === 'fr' ? 'fr' : 'en') as Article['locale'],
			languageTag: toString(article.languageTag, article.locale === 'fr' ? 'fr-CA' : 'en'),
			canonicalSlug: toString(article.canonicalSlug, slug),
			translationOf: toString(article.translationOf) || undefined,
			translationStatus: toString(article.translationStatus) || undefined,
			translatedSlug: toString(article.translatedSlug) || undefined,
			translations: toObject(article.translations) as Article['translations'],
			status,
			draftType,
			summary: toString(article.summary, ''),
			tags,
			audience: toStringArray(article.audience),
			date,
			dateLabel,
			updatedDate,
			updatedDateLabel,
			releaseDate: toString(article.releaseDate) || undefined,
			releaseDateLabel: toString(article.releaseDateLabel) || undefined,
			credits: toStringArray(article.credits),
			references: toStringArray(article.references),
			relatedPosts: toStringArray(article.relatedPosts),
			design: toSafeDesign(article.design, article),
			html: toString(article.html, ''),
			body: toString(article.body, ''),
			toc: Array.isArray(article.toc) ? (article.toc as Article['toc']) : [],
			wordCount: toNumber(article.wordCount, 0),
			readingMinutes: toNumber(article.readingMinutes, 1)
		} as Article;
	}
</script>

{#if isDiff && safeArticle.previousBody}
	<ArticleDiffView article={safeArticle} />
{:else}
	<ArticleView article={safeArticle} relatedArticles={safeRelatedArticles} alternates={safeAlternates} />
{/if}
