import { renderMarkdown, slugify, type MarkdownLinkTerm, type RenderedMarkdown, type TocItem } from './markdown';

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
	railPalette?: ArticlePalette;
	railChips?: string[];
	railChipsLabel?: string;
	railCalloutHtml: string;
	footerText: string;
};

type RawArticleModule = Record<string, string>;

export type ArticleMeta = {
	title: string;
	slug: string;
	status: string;
	draftType: string;
	summary: string;
	tags: string[];
	audience: string[];
	date: string;
	dateLabel: string;
	updatedDate: string;
	updatedDateLabel: string;
	releaseDate?: string;
	releaseDateLabel?: string;
	credits: string[];
	references: string[];
	relatedPosts: string[];
	design: ArticleDesign;
};

export type Article = ArticleMeta & RenderedMarkdown & {
	body: string;
	toc: TocItem[];
};

const modules = import.meta.glob('./content/articles/*.md', {
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

export const articles: Article[] = Object.entries(modules)
	.map(([path, raw]) => parseArticle(path, raw))
	.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

export const publishedArticles = articles.filter((article) => article.status === 'published');
export const draftArticles = articles.filter((article) => article.status !== 'published');
export const publishedArticleTags = Array.from(new Set(publishedArticles.flatMap((article) => article.tags))).sort((left, right) =>
	left.localeCompare(right)
);
export const articleTags = Array.from(new Set(articles.flatMap((article) => article.tags))).sort((left, right) =>
	left.localeCompare(right)
);

export function getArticle(slug: string): Article | undefined {
	return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(
	article: Pick<ArticleMeta, 'slug' | 'status' | 'tags' | 'relatedPosts' | 'draftType'>,
	limit = 3
): Article[] {
	const pool = article.status === 'published' ? publishedArticles : articles;
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
			return right.candidate.date.localeCompare(left.candidate.date) || left.candidate.title.localeCompare(right.candidate.title);
		})
		.slice(0, limit)
		.map(({ candidate }) => candidate);

	if (ranked.length >= limit) {
		return ranked;
	}

	const fallback = pool
		.filter((candidate) => candidate.slug !== article.slug && !ranked.some((item) => item.slug === candidate.slug))
		.sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title));

	return [...ranked, ...fallback].slice(0, limit);
}

function parseArticle(path: string, raw: string): Article {
	const { frontmatter, body } = splitFrontmatter(raw);
	const filename = path.split('/').pop()?.replace(/\.md$/, '') ?? 'article';
	const title = stringValue(frontmatter.title) || firstHeading(body) || filename;
	const slug = stringValue(frontmatter.slug) || slugify(title);
	const status = stringValue(frontmatter.status) || 'draft';
	const draftType = stringValue(frontmatter.draft_type) || 'technical-blog-post';
	const summary = stringValue(frontmatter.summary) || '';
	const tags = arrayValue(frontmatter.tags);
	const date = stringValue(frontmatter.date) || filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '2026-05-28';
	const dateLabel = formatArticleDate(date);
	const updatedDate = stringValue(frontmatter.updated_date) || stringValue(frontmatter.modified_date) || date;
	const updatedDateLabel = formatArticleDate(updatedDate);
	const releaseDate = stringValue(frontmatter.release_date);
	const releaseDateLabel = releaseDate ? formatArticleDate(releaseDate) : '';
	const credits = arrayValue(frontmatter.credits);
	const linkTerms = arrayValue(frontmatter.link_terms)
		.map(parseLinkTerm)
		.filter((term): term is MarkdownLinkTerm => term !== null);
	const rendered = renderMarkdown(body, { linkTerms });

	return {
		...rendered,
		title,
		slug,
		status,
		draftType,
		summary,
		tags,
		audience: arrayValue(frontmatter.audience),
		date,
		dateLabel,
		updatedDate,
		updatedDateLabel,
		releaseDate: releaseDate || undefined,
		releaseDateLabel: releaseDateLabel || undefined,
		credits: credits.length ? credits : ['Ryan Spice'],
		references: arrayValue(frontmatter.references),
		relatedPosts: arrayValue(frontmatter.related_posts),
		design: designFor({ slug, title, status, draftType, summary, tags, date, dateLabel, updatedDate, updatedDateLabel, releaseDate, releaseDateLabel }),
		body
	};
}

function designFor(
	article: Pick<
		ArticleMeta,
		'slug' | 'title' | 'status' | 'draftType' | 'summary' | 'tags' | 'date' | 'dateLabel' | 'updatedDate' | 'updatedDateLabel' | 'releaseDate' | 'releaseDateLabel'
	>
): ArticleDesign {
	const common = {
		brandLabel: 'Ryan Spice / Canopy Digital',
		tocTitle: 'Contents',
		accent: accentForSlug(article.slug)
	};

	if (article.slug === 'gimp-3-repair-photogimp-pixelboats-workstation') {
		return {
			...common,
			variant: 'repair',
			eyebrow: 'Tooling repair log · PixelBoats',
			tags: ['GIMP 3.2', 'PhotoGIMP', "G'MIC-Qt", 'Windows 11', 'Pixel Art', 'DLL Debugging'],
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
			tags: ['GIMP 3', 'Python Plug-ins', 'Pango', 'Windhawk', 'DLLs', 'Windows 11'],
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
			tags: ['Phaser', 'PixiJS', 'WebGPU', 'Game Engine', '2.5D', 'Water Simulation', 'Multiplayer', 'Colyseus'],
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

	return {
		...common,
		variant: 'default',
		eyebrow: `Technical blog · ${article.status}`,
		tags: article.tags,
		cardPalette: {
			label: 'Blog palette',
			colors: ['#1e9bff', '#0b0f14', '#53b8ff', '#f2d27c', '#ff00ff']
		},
		navLinks: [{ label: 'Articles', href: '/#articles' }],
		heroCardTitle: 'Article profile',
		heroCardAria: 'Article details',
		statusItems: [
			{ label: 'Type', value: article.draftType.replaceAll('-', ' ') },
			{ label: 'Status', value: article.status },
			{ label: 'Date', value: article.dateLabel },
			...(article.releaseDateLabel ? [{ label: 'Release', value: article.releaseDateLabel }] : [])
		],
		railTitle: 'Publishing notes',
		railBodyHtml: 'This route is static-friendly and generated from local Markdown.',
		railChips: ['Static SvelteKit', 'Local Markdown', 'pnpm'],
		railCalloutHtml: '<strong>Editorial angle:</strong> practical technical notes with durable source context.',
		footerText: `Updated last ${article.updatedDateLabel} · Static SvelteKit article generated from local Markdown.`
	};
}

function accentForSlug(slug: string): string {
	return articleAccents[slug] ?? '#1e9bff';
}

type Frontmatter = Record<string, string | string[]>;

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

function formatArticleDate(value: string): string {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}

function firstHeading(body: string): string | undefined {
	return body.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function normalizeRelatedTarget(value: string): string {
	return slugify(
		value
			.replace(/\.md$/i, '')
			.replace(/^\d{4}-\d{2}-\d{2}-/, '')
			.trim()
	);
}
