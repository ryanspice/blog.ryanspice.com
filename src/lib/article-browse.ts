import { base } from '$app/paths';
import type { Article } from './articles';

export type ArticleIndexStatus = 'published' | 'draft' | 'all';
export type ArticleIndexView = 'compact' | 'full';

export type ArticleIndexHrefOptions = {
	view?: ArticleIndexView;
	status?: ArticleIndexStatus;
	tag?: string;
	q?: string;
};

export function articleIndexHref(options: ArticleIndexHrefOptions = {}): string {
	const searchParams = new URLSearchParams();
	const targetBase = options.status === 'draft' ? `${base}/drafts` : base;

	if (options.view === 'compact') {
		searchParams.set('view', 'compact');
	}

	if (options.status && options.status !== 'published' && options.status !== 'draft') {
		searchParams.set('status', options.status);
	}

	if (options.tag) {
		searchParams.set('tag', options.tag);
	}

	if (options.q) {
		searchParams.set('q', options.q);
	}

	const query = searchParams.toString();
	return query ? `${targetBase}/?${query}` : `${targetBase}/`;
}

export function articleTagIndexHref(tag: string, status: ArticleIndexStatus = 'published'): string {
	return articleIndexHref({ view: 'compact', status, tag });
}

export function articleSearchText(article: Article): string {
	return [
		article.title,
		article.summary,
		article.draftType,
		article.status,
		...article.tags,
		...article.design.tags
	]
		.join(' ')
		.toLowerCase();
}

export function articleMatchesTag(article: Article, tag: string): boolean {
	const normalizedTag = normalizeTag(tag);
	return [...article.tags, ...article.design.tags].some(
		(candidate) => normalizeTag(candidate) === normalizedTag
	);
}

/**
 * Tag alias map — variants that should resolve to the same set of articles.
 * When any alias is clicked or searched, ALL aliases in the group are matched.
 * This handles version differences (gimp/gimp-3), naming variants, and
 * singular/plural forms without requiring every article to use every tag variant.
 *
 * The map is the canonical set: keys are the displayed/searchable forms.
 * Values are arrays of equivalent forms, all of which will match articles
 * carrying ANY form in the group.
 */
const TAG_ALIAS_GROUPS: Record<string, string[]> = {
	gimp: ['gimp', 'gimp-3', 'gimp 3', 'gimp 3.2'],
	'windows-11': ['windows-11', 'windows 11'],
	'dll-debugging': ['dll-debugging', 'dlls', 'dll debugging'],
	'pixel-art': ['pixel-art', 'pixel art'],
	photogimp: ['photogimp'],
	gmic: ['gmic', "g'mic-qt"],
	'indie-game-dev': ['indie game dev', 'indie game development'],
	'water-simulation': ['water simulation'],
	'game-engine-comparison': ['game engine comparison', 'game engine'],
	'2-5d-rendering': ['2.5d rendering', '2.5d'],
	'pixelboats': ['pixelboats', 'pixelboats'],
};

/** Build a reverse-lookup: any alias form → canonical key. */
const TAG_ALIAS_REVERSE: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(TAG_ALIAS_GROUPS)) {
	for (const alias of aliases) {
		TAG_ALIAS_REVERSE[alias] = canonical;
	}
}

function normalizeTag(value: string): string {
	const cleaned = value.trim().toLowerCase();
	// Resolve through alias map — all variants in a group map to the same canonical
	return TAG_ALIAS_REVERSE[cleaned] ?? cleaned;
}
