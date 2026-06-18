import { renderMarkdown, slugify, type MarkdownLinkTerm, type RenderedMarkdown, type TocItem } from './markdown';
import {
	articleVisualsFromFrontmatter,
	splitFrontmatter as parseFrontmatter,
	type ArticleVisuals,
	type Frontmatter,
	stringValue as frontmatterStringValue
} from './article-frontmatter';
import {
	DEFAULT_LOCALE,
	localeToLanguageTag,
	pathWithLocale,
	resolveLocale,
	type SupportedLocale
} from './i18n/locales';

export type NavItem = {
	label: string;
	href: string;
};

export type StatusItem = {
	label: string;
	value: string;
};

export type ArticlePalette = {
	label: string;
	colors: string[];
};

export type ArticleDesign = {
	variant: 'repair' | 'debug' | 'default';
	brandLabel: string;
	navLinks: NavItem[];
	eyebrow: string;
	tags: string[];
	accent: string;
	cardPalette?: ArticlePalette;
	heroCardTitle: string;
	heroCardAria: string;
	statusItems: StatusItem[];
	tocTitle: string;
	railTitle: string;
	railBodyHtml: string;
	railStatusItems?: StatusItem[];
	railPalette?: ArticlePalette;
	railChips?: string[];
	railChipsLabel?: string;
	railCalloutHtml: string;
	footerText: string;
};

type RawArticleModule = Record<string, string>;

export type ArticleMeta = {
	title: string;
	seoTitle?: string;
	slug: string;
	locale: SupportedLocale;
	languageTag: string;
	translationOf?: string;
	translationStatus?: string;
	canonicalSlug: string;
	translatedSlug?: string;
	translations: Partial<Record<SupportedLocale, string>>;
	status: string;
	draftType: string;
	summary: string;
	seoDescription?: string;
	tags: string[];
	audience: string[];
	date: string;
	dateLabel: string;
	releaseTime?: string;
	updatedDate: string;
	updatedDateLabel: string;
	releaseDate?: string;
	releaseDateLabel?: string;
	version: string;
	previousVersion: string | null;
	visuals: ArticleVisuals;
	credits: string[];
	references: string[];
	relatedPosts: string[];
	design: ArticleDesign;
};

export type Article = ArticleMeta & RenderedMarkdown & {
	body: string;
	previousBody: string | null;
	toc: TocItem[];
};

const modules = import.meta.glob('./content/articles/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const localizedModules = import.meta.glob('./content/articles/fr/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const versionModules = import.meta.glob('./content/articles/.versions/**/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const articleAccents: Record<string, string> = {
	'gimp-3-repair-photogimp-pixelboats-workstation': '#f2d27c',
	'debugging-gimp-3-python-plugin-failures-windows-windhawk': '#ffcf77',
	'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game': '#87dac4',
	'how-chatgpt-performs-deep-research': '#7c5cff',
	'ship-fast-for-windows-microsoft-store-playbook': '#53b8ff',
	'hermes-deepseek-setup': '#1e9bff',
	'what-can-you-actually-do-with-a-deepseek-api-key': '#ff00ff',
	'ingesting-voxel-engine-optimisations-ai-wiki-pixelboats': '#b87936',
	'pixelboats-water-pipeline-pixi-webgl': '#0078d4',
	'pixelboats-networking-final-recommendation': '#87dac4',
	'pixelboats-networking-player-hosted-php': '#00c2ff'
};

const buildDate = new Date();

// NOTE: renderMarkdown is async (unified pipeline + server-only Shiki highlighting), so article parsing is async as well.
// Top-level await is supported by Vite/SvelteKit and keeps the export contract unchanged.
export const articles: Article[] = (await Promise.all([...Object.entries(modules), ...Object.entries(localizedModules)].map(([path, raw]) => parseArticle(path, raw))))
	.sort((a, b) => effectivePublishDate(b).localeCompare(effectivePublishDate(a)) || a.title.localeCompare(b.title));

export const allPublishedArticles = articles.filter(isPublicArticle);
export const publishedArticles = getPublishedArticlesForLocale(DEFAULT_LOCALE);
export const draftArticles = articles.filter((article) => !isPublicArticle(article));
export const scheduledArticles = draftArticles.filter((article) => article.releaseDate && article.status !== 'published');
export const publishedArticleTags = getPublishedArticleTagsForLocale(DEFAULT_LOCALE);
export const articleTags = Array.from(new Set(articles.flatMap((article) => article.tags))).sort((left, right) =>
	left.localeCompare(right)
);

export function getArticlesForLocale(locale: SupportedLocale = DEFAULT_LOCALE): Article[] {
	return articles.filter((article) => article.locale === locale);
}

export function getPublishedArticlesForLocale(locale: SupportedLocale = DEFAULT_LOCALE): Article[] {
	return allPublishedArticles.filter((article) => article.locale === locale);
}

export function getPublishedArticleTagsForLocale(locale: SupportedLocale = DEFAULT_LOCALE): string[] {
	return Array.from(new Set(getPublishedArticlesForLocale(locale).flatMap((article) => article.tags))).sort((left, right) =>
		left.localeCompare(right)
	);
}

export function getArticle(slug: string, locale: SupportedLocale = DEFAULT_LOCALE): Article | undefined {
	return articles.find((article) => article.locale === locale && article.slug === slug);
}

export function getArticleTranslationGroup(article: ArticleMeta): Article[] {
	const key = translationGroupKey(article);
	return allPublishedArticles
		.filter((candidate) => translationGroupKey(candidate) === key)
		.sort((left, right) => left.locale.localeCompare(right.locale));
}

export function getArticleAlternates(article: ArticleMeta): Array<{ locale: SupportedLocale; hreflang: string; path: string }> {
	const variants = getArticleTranslationGroup(article);
	if (variants.length < 2) return [];

	return variants.map((variant) => ({
		locale: variant.locale,
		hreflang: localeToLanguageTag(variant.locale),
		path: pathWithLocale(variant.locale, `/${variant.slug}/`)
	}));
}

export function isPublicArticle(article: Pick<ArticleMeta, 'status' | 'releaseDate'>): boolean {
	if (article.status === 'published') return true;
	return Boolean(article.releaseDate && isDateReached(article.releaseDate, buildDate));
}

export function effectivePublishDate(article: Pick<ArticleMeta, 'date' | 'releaseDate'>): string {
	return article.releaseDate || article.date;
}

export function getRelatedArticles(
	article: Pick<ArticleMeta, 'slug' | 'status' | 'tags' | 'relatedPosts' | 'draftType'>,
	limit = 3
): Article[] {
	const locale = 'locale' in article ? resolveLocale((article as Pick<ArticleMeta, 'locale'>).locale) : DEFAULT_LOCALE;
	const pool = isPublicArticle(article) ? getPublishedArticlesForLocale(locale) : getArticlesForLocale(locale);
	const explicitTargets = new Set(article.relatedPosts.map((target) => normalizeRelatedTarget(target)));
	const articleTags = new Set(article.tags.map((tag) => tag.toLowerCase()));

	const ranked = pool
		.filter((candidate) => candidate.slug !== article.slug)
		.map((candidate) => {
			let score = 0;

			if (explicitTargets.has(candidate.slug)) {
				score += 100;
			}

			if (candidate.relatedPosts.some((target) => normalizeRelatedTarget(target) === article.slug)) {
				score += 45;
			}

			const sharedTags = candidate.tags.filter((tag) => articleTags.has(tag.toLowerCase())).length;
			score += sharedTags * 12;

			if (candidate.draftType === article.draftType) {
				score += 3;
			}

			return { candidate, score };
		})
		.filter(({ score }) => score > 0)
		.sort((left, right) => {
			if (right.score !== left.score) return right.score - left.score;
			return effectivePublishDate(right.candidate).localeCompare(effectivePublishDate(left.candidate)) || left.candidate.title.localeCompare(right.candidate.title);
		})
		.slice(0, limit)
		.map(({ candidate }) => candidate);

	if (ranked.length >= limit) {
		return ranked;
	}

	const fallback = pool
		.filter((candidate) => candidate.slug !== article.slug && !ranked.some((item) => item.slug === candidate.slug))
		.sort((left, right) => effectivePublishDate(right).localeCompare(effectivePublishDate(left)) || left.title.localeCompare(right.title));

	return [...ranked, ...fallback].slice(0, limit);
}

async function parseArticle(path: string, raw: string): Promise<Article> {
	const { frontmatter, body } = parseFrontmatter(raw);
	const filename = path.split('/').pop()?.replace(/\.md$/, '') ?? 'article';
	const pathLocale = path.includes('/content/articles/fr/') ? 'fr' : DEFAULT_LOCALE;
	const locale = resolveLocale(stringValue(frontmatter.locale) || pathLocale);
	const title = stringValue(frontmatter.title) || firstHeading(body) || filename;
	const seoTitle = stringValue(frontmatter.seo_title) || stringValue(frontmatter.seoTitle);
	const renderedBody = stripLeadingTitleHeading(body);
	const slug = stringValue(frontmatter.slug) || slugify(title);
	const translationOf = stringValue(frontmatter.translation_of);
	const canonicalSlug = stringValue(frontmatter.canonical_slug) || translationOf || slug;
	const translatedSlug = stringValue(frontmatter.translated_slug);
	const translationStatus = stringValue(frontmatter.translation_status);
	const translations = parseTranslations(arrayValue(frontmatter.translations));
	const status = stringValue(frontmatter.status) || 'draft';
	const draftType = stringValue(frontmatter.draft_type) || 'technical-blog-post';
	const summary = stringValue(frontmatter.summary) || '';
	const seoDescription = stringValue(frontmatter.seo_description) || stringValue(frontmatter.seoDescription);
	const tags = arrayValue(frontmatter.tags);
	const date = stringValue(frontmatter.date) || filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '2026-05-28';
	const dateLabel = formatArticleDate(date, locale);
	const updatedDate = stringValue(frontmatter.updated_date) || stringValue(frontmatter.modified_date) || date;
	const updatedDateLabel = formatArticleDate(updatedDate, locale);
	const releaseDate = stringValue(frontmatter.release_date);
	const releaseTime = frontmatterStringValue(frontmatter.release_time);
	const releaseDateLabel = releaseDate ? formatArticleDate(releaseDate, locale) : '';
	const version = stringValue(frontmatter.version) || '1.0.0';
	const previousVersion = stringValue(frontmatter.previous_version) || null;
	const visuals = articleVisualsFromFrontmatter(frontmatter);
	const credits = arrayValue(frontmatter.credits);
	const linkTerms = arrayValue(frontmatter.link_terms)
		.map(parseLinkTerm)
		.filter((term): term is MarkdownLinkTerm => term !== null);
	const rendered = await renderMarkdown(renderedBody, { linkTerms });
	const previousBody = previousVersion ? loadPreviousBody(slug, previousVersion) : null;

	return {
		...rendered,
		title,
		...(seoTitle ? { seoTitle } : {}),
		slug,
		locale,
		languageTag: localeToLanguageTag(locale),
		...(translationOf ? { translationOf } : {}),
		...(translationStatus ? { translationStatus } : {}),
		canonicalSlug,
		...(translatedSlug ? { translatedSlug } : {}),
		translations,
		status,
		draftType,
		summary,
		...(seoDescription ? { seoDescription } : {}),
		tags,
		audience: arrayValue(frontmatter.audience),
		date,
		dateLabel,
		updatedDate,
		updatedDateLabel,
		releaseDate: releaseDate || undefined,
		releaseTime: releaseTime || undefined,
		releaseDateLabel: releaseDateLabel || undefined,
		version,
		previousVersion,
		previousBody: previousBody ? stripLeadingTitleHeading(previousBody) : null,
		visuals,
		credits: credits.length ? credits : ['Ryan Spice'],
		references: arrayValue(frontmatter.references),
		relatedPosts: arrayValue(frontmatter.related_posts),
		design: designFor({ slug, locale, title, status, draftType, summary, tags, date, dateLabel, updatedDate, updatedDateLabel, releaseDate, releaseDateLabel }),
		body: renderedBody
	};
}

function loadPreviousBody(slug: string, version: string): string | null {
	const versionPath = `./content/articles/.versions/${slug}/${version}.md`;
	const raw = versionModules[versionPath];
	if (!raw || typeof raw !== 'string') return null;
	const { body } = splitFrontmatter(raw);
	return body || null;
}

function designFor(
	article: Pick<
		ArticleMeta,
		'slug' | 'locale' | 'title' | 'status' | 'draftType' | 'summary' | 'tags' | 'date' | 'dateLabel' | 'updatedDate' | 'updatedDateLabel' | 'releaseDate' | 'releaseDateLabel'
	>
): ArticleDesign {
	const isFrench = article.locale === 'fr';
	const common = {
		brandLabel: 'Ryan Spice / Canopy Digital',
		tocTitle: isFrench ? 'Sommaire' : 'Contents',
		accent: accentForSlug(article.slug)
	};

	if (article.slug === 'gimp-3-repair-photogimp-pixelboats-workstation') {
		return {
			...common,
			variant: 'repair',
			eyebrow: 'Tooling repair log · PixelBoats',
			tags: ['GIMP', 'GIMP 3', 'Windows 11', 'Pixel Art', 'Windhawk', 'DLL Debugging', 'PhotoGIMP', "G'MIC", 'PixelBoats'],
			navLinks: [
				{ label: 'Problem', href: '#the-symptom' },
				{ label: 'Debugging', href: '#the-useful-test-hard-isolated-launch' },
				{ label: 'PixelBoats Kit', href: '#creating-the-pixelboats-gimp-kit' },
				{ label: 'Next', href: '#future-improvements' }
			],
			cardPalette: {
				label: 'Repair palette',
				colors: ['#f2d27c', '#112032', '#0078d4', '#53b8ff', '#ff00ff']
			},
			heroCardTitle: 'Production outcome',
			heroCardAria: 'Article summary',
			statusItems: [
				{ label: 'GIMP', value: 'Repaired' },
				{ label: 'PhotoGIMP', value: 'Installed' },
				{ label: "G'MIC", value: 'Working' },
				{ label: 'PixelBoats Kit', value: 'Installed' },
				{ label: 'Old plug-ins', value: 'Quarantined' },
				{ label: 'Date', value: article.dateLabel }
			],
			railTitle: 'Reference notes',
			railBodyHtml: 'This article stays practical: repair steps, a safe asset restore order, and a PixelBoats-ready workstation setup.',
			railPalette: {
				label: 'PixelBoats palette preview',
				colors: ['#080c14', '#112032', '#2d5c79', '#0078d4', '#53b8ff', '#f2d27c', '#b87936', '#ff00ff']
			},
			railCalloutHtml: '<strong>Editorial angle:</strong> tooling repair as production infrastructure, not just “I fixed my app.”',
			footerText: `Updated last ${article.updatedDateLabel} · Static SvelteKit article generated from local Markdown.`
		};
	}

	if (article.slug === 'debugging-gimp-3-python-plugin-failures-windows-windhawk') {
		return {
			...common,
			variant: 'debug',
			eyebrow: 'Windows debugging · GIMP 3 · Windhawk',
			tags: ['GIMP', 'GIMP 3', 'Windows 11', 'Windhawk', 'DLL Debugging', 'Python', 'Troubleshooting'],
			navLinks: [
				{ label: 'First error', href: '#the-misleading-first-error' },
				{ label: 'The test', href: '#the-test-that-changed-the-diagnosis' },
				{ label: 'Windhawk', href: '#the-spoiler-windhawk-was-a-strong-suspect' },
				{ label: 'Repair sequence', href: '#safe-repair-sequence' }
			],
			cardPalette: {
				label: 'Debug palette',
				colors: ['#ffcf77', '#090909', '#232733', '#6fa8dc', '#d44c36']
			},
			heroCardTitle: 'Debugging outcome',
			heroCardAria: 'Article summary',
			statusItems: [
				{ label: 'First symptom', value: '_Unwind_Resume' },
				{ label: 'Better clue', value: 'Pango / GI' },
				{ label: 'Suspect', value: 'Windhawk hooks' },
				{ label: 'Secondary risk', value: 'PATH DLLs' },
				{ label: 'Outcome', value: 'Clean launch' },
				{ label: 'Date', value: article.dateLabel }
			],
			railTitle: 'Debugging angle',
			railBodyHtml: 'This page is intentionally more searchable and technical than the PixelBoats workflow article.',
			railChipsLabel: 'Debugging stack',
			railChips: ['_Unwind_Resume', 'libgraphite2.dll', 'libpango-1.0-0.dll', 'gi.repository', 'Windhawk hooks', 'PATH DLL pollution'],
			railCalloutHtml: '<strong>Editorial angle:</strong> the search-friendly article people needed when the error message pointed everywhere except the actual suspect.',
			footerText: `Updated last ${article.updatedDateLabel} · Static SvelteKit article generated from local Markdown.`
		};
	}

	if (article.slug === 'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game') {
		return {
			...common,
			variant: 'default',
			eyebrow: 'Engine decision log · May 2026',
			tags: ['Phaser', 'PixiJS', 'WebGPU', 'Game Engine Comparison', '2.5D Rendering', 'Water Simulation', 'Multiplayer', 'Colyseus', 'Indie Game Dev'],
			navLinks: [
				{ label: 'Decision', href: '#the-decision-that-looked-easy-until-it-wasnt' },
				{ label: 'Architecture', href: '#the-architecture-that-emerged' },
				{ label: 'Stack', href: '#the-stack-im-shipping-with' }
			],
			cardPalette: {
				label: 'Engine palette',
				colors: ['#53b8ff', '#112032', '#2d5c79', '#87dac4', '#ffcf77']
			},
			heroCardTitle: 'Decision outcome',
			heroCardAria: 'Article summary',
			statusItems: [
				{ label: 'Chosen', value: 'PixiJS 8.18 + Colyseus' },
				{ label: 'Runner-up', value: 'Phaser 4.1' },
				{ label: '3D fallback', value: 'Three.js / Babylon.js (future)' },
				{ label: 'License', value: 'MIT (all)' },
				{ label: 'Date', value: article.dateLabel }
			],
			railTitle: 'The framing that changed everything',
			railBodyHtml: 'The question was framed as "Phaser vs PixiJS" but the real answer came from naming the actual rendering problem: a height field driving vertex displacement, particles, and custom projection. Once that was clear, Phaser\'s abstractions became overhead and Pixi\'s Mesh/Filter primitives became the natural fit.',
			railChips: ['2.5D surface rendering', 'WebGPU compute path', 'GLSL/WGSL shaders', 'Colyseus multiplayer', 'GPU-first with fallback'],
			railChipsLabel: 'Key technical decisions',
			railCalloutHtml: '<strong>Editorial angle:</strong> the most important step in engine evaluation is naming your actual rendering problem — not comparing feature lists.',
			footerText: `Updated last ${article.updatedDateLabel} · Static SvelteKit article generated from AI Wiki deep research work.`
		};
	}

	if (article.slug === 'how-chatgpt-performs-deep-research') {
		return {
			...common,
			variant: 'default',
			eyebrow: 'Research comparison · OpenAI vs DeepSeek',
			tags: ['ChatGPT', 'Deep Research', 'DeepSeek', 'Reasoning Models', 'LLMs', 'Agentic Workflows'],
			navLinks: [
				{ label: 'Short version', href: '#the-short-version' },
				{ label: 'Overlap', href: '#where-the-two-systems-overlap' },
				{ label: 'Difference', href: '#retrieval-is-the-real-difference' },
				{ label: 'Takeaway', href: '#the-useful-mental-model' }
			],
			cardPalette: {
				label: 'Research palette',
				colors: ['#1e9bff', '#0f172a', '#53b8ff', '#7c5cff', '#f2d27c']
			},
			heroCardTitle: 'Comparison frame',
			heroCardAria: 'Comparison summary',
			statusItems: [
				{ label: 'OpenAI', value: 'Governed research workflow' },
				{ label: 'DeepSeek', value: 'Reasoning/API substrate' },
				{ label: 'Primary question', value: 'Workflow vs model layer' },
				{ label: 'Date', value: article.dateLabel }
			],
			railTitle: 'What to notice',
			railBodyHtml:
				'Read the comparison as two layers: the product workflow you use in front, and the model/API substrate underneath. That split is the point of the article.',
			railChipsLabel: 'Signals to watch',
			railChips: ['product workflow', 'model substrate', 'governance', 'retrieval', 'developer control'],
			railCalloutHtml:
				'<strong>Editorial angle:</strong> compare the layer you are actually using — research workflow, model API, or both.',
			footerText: `Updated last ${article.updatedDateLabel} · Static SvelteKit comparison article generated from local Markdown.`
		};
	}

	const isDraft = !isPublicArticle(article);

	return {
		...common,
		variant: 'default',
		eyebrow: isFrench ? `Blogue technique · ${isDraft ? article.status : 'publie'}` : `Technical blog · ${isDraft ? article.status : 'published'}`,
		tags: article.tags,
		cardPalette: {
			label: 'Blog palette',
			colors: ['#1e9bff', '#0b0f14', '#53b8ff', '#f2d27c', '#ff00ff']
		},
		navLinks: [{ label: 'Articles', href: article.locale === 'fr' ? '/fr/#articles' : '/#articles' }],
		heroCardTitle: isFrench ? "Profil de l'article" : 'Article profile',
		heroCardAria: isFrench ? "Details de l'article" : 'Article details',
		statusItems: [
			{ label: isFrench ? 'Type' : 'Type', value: article.draftType.replaceAll('-', ' ') },
			{ label: isFrench ? 'Statut' : 'Status', value: isFrench ? (isDraft ? article.status : 'publie') : isDraft ? article.status : 'published' },
			{ label: 'Date', value: article.dateLabel },
			...(article.releaseDateLabel ? [{ label: isFrench ? 'Publication' : 'Release', value: article.releaseDateLabel }] : [])
		],
		railTitle: isFrench ? (isDraft ? 'Outil de publication' : 'Notes de publication') : isDraft ? 'Publishing tool' : 'Publishing notes',
		railBodyHtml: isDraft
			? 'Set the release date, pin the publish window, and keep the draft parked until the final review passes.'
			: isFrench
				? 'Cette route est compatible avec le rendu statique et generee depuis Markdown local.'
				: 'This route is static-friendly and generated from local Markdown.',
		railStatusItems: isDraft
			? [
					{ label: 'Schedule date', value: article.releaseDateLabel ?? 'Choose a date' },
					{ label: 'Publish time', value: 'TBD' },
					{ label: 'Queue', value: 'Draft review' },
					{ label: 'Target', value: 'ryanspice.com' }
				]
			: undefined,
		railChips: isDraft ? undefined : isFrench ? ['SvelteKit statique', 'Markdown local', 'pnpm'] : ['Static SvelteKit', 'Local Markdown', 'pnpm'],
		railCalloutHtml: isDraft
			? '<strong>Editorial angle:</strong> turn the draft into a release plan before the final pass.'
			: isFrench
				? '<strong>Angle editorial:</strong> notes techniques pratiques avec contexte source durable.'
				: '<strong>Editorial angle:</strong> practical technical notes with durable source context.',
		footerText: isFrench
			? `Mis a jour le ${article.updatedDateLabel} · Article SvelteKit statique genere depuis Markdown local.`
			: `Updated last ${article.updatedDateLabel} · Static SvelteKit article generated from local Markdown.`
	};
}

function accentForSlug(slug: string): string {
	return articleAccents[slug] ?? '#1e9bff';
}

function splitFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
	const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) {
		return { frontmatter: {}, body: normalized };
	}

	const end = normalized.indexOf('\n---', 4);
	if (end < 0) {
		return { frontmatter: {}, body: normalized };
	}

	const yaml = normalized.slice(4, end);
	const body = normalized.slice(end + 4).trimStart();
	return { frontmatter: parseSimpleYaml(yaml), body };
}

function parseSimpleYaml(yaml: string): Frontmatter {
	const result: Frontmatter = {};
	let activeKey: string | null = null;

	for (const line of yaml.split('\n')) {
		const listItem = line.match(/^\s+-\s+(.+)$/);
		if (listItem && activeKey) {
			const current = result[activeKey];
			result[activeKey] = [...(Array.isArray(current) ? current : []), cleanYamlValue(listItem[1])];
			continue;
		}

		const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (pair) {
			activeKey = pair[1];
			const value = pair[2];
			result[activeKey] = value ? cleanYamlValue(value) : [];
		}
	}

	return result;
}

function cleanYamlValue(value: string): string {
	return value.trim().replace(/^[ '\"]|[ '\"]$/g, '').replace(/^['\"]|['\"]$/g, '');
}

function stringValue(value: string | string[] | undefined): string {
	return typeof value === 'string' ? value : '';
}

function arrayValue(value: string | string[] | undefined): string[] {
	return Array.isArray(value) ? value : [];
}

function parseLinkTerm(value: string): MarkdownLinkTerm | null {
	const [label, ...rest] = value.split('|');
	const href = rest.join('|').trim();
	const cleanedLabel = label?.trim() ?? '';

	if (!cleanedLabel || !href) return null;
	return { label: cleanedLabel, href };
}

function formatArticleDate(value: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}

function isDateReached(value: string, now: Date): boolean {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return false;
	const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return parsed.getTime() <= todayUtc;
}

function firstHeading(body: string): string | undefined {
	return body.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function stripLeadingTitleHeading(body: string): string {
	return body.replace(/^\s*#\s+.+?[ \t]*\n+/, '');
}

function normalizeRelatedTarget(value: string): string {
	return slugify(
		value
			.replace(/\.md$/i, '')
			.replace(/^\d{4}-\d{2}-\d{2}-/, '')
			.trim()
	);
}

function parseTranslations(values: string[]): Partial<Record<SupportedLocale, string>> {
	const translations: Partial<Record<SupportedLocale, string>> = {};

	for (const value of values) {
		const [locale, slug] = value.split('|').map((part) => part.trim());
		const resolvedLocale = resolveLocale(locale);
		if (resolvedLocale && slug) translations[resolvedLocale] = slug;
	}

	return translations;
}

function translationGroupKey(article: Pick<ArticleMeta, 'translationOf' | 'canonicalSlug' | 'slug'>): string {
	return article.translationOf || article.canonicalSlug || article.slug;
}
