import { contentTagsMatch, uniqueContentTags } from './tags';

export type DevLogEntry = {
	date: string;
	dateLabel: string;
	title: string;
	summary: string;
	source: string;
	accent: string;
	tags: string[];
	relatedArticleSlugs: string[];
	relatedArticleTags: string[];
};

type DevLogSeed = Omit<DevLogEntry, 'dateLabel'>;

const devLogSeeds: DevLogSeed[] = [
	{
		date: '2026-06-04',
		title: 'Ingest the PixelBoats rigging and sail-order lab',
		summary:
			'Added the latest rigging demo to the blog repo, captured the captain-order research path, and staged a draft article plus a library page for reusable references.',
		source: 'PixelBoats demo research',
		accent: '#00aeef',
		tags: ['pixelboats', 'desktop apps', 'sea loop', 'rigging'],
		relatedArticleSlugs: ['ship-fast-for-windows-microsoft-store-playbook', 'pixelboats-water-pipeline-pixi-webgl'],
		relatedArticleTags: ['PixelBoats', 'Water Simulation']
	},
	{
		date: '2026-05-30',
		title: 'Seed the public dev log',
		summary: 'Added a lightweight place for blog work, repo notes, and future command summaries.',
		source: 'Blog process',
		accent: '#1e9bff',
		tags: ['blog', 'process', 'automation'],
		relatedArticleSlugs: [],
		relatedArticleTags: ['blog']
	},
	{
		date: '2026-05-29',
		title: 'Keep unpublished work in its own lane',
		summary:
			'Added /drafts so unfinished pieces stay separate from the public homepage while still being easy to review.',
		source: 'SvelteKit route',
		accent: '#53b8ff',
		tags: ['workflow', 'drafts', 'sveltekit'],
		relatedArticleSlugs: [],
		relatedArticleTags: ['SvelteKit']
	},
	{
		date: '2026-05-29',
		title: 'Make article navigation feel continuous',
		summary:
			'Wired article titles into native view transitions so clicks move the title into the reading page instead of hard-cutting.',
		source: 'UX pass',
		accent: '#f2d27c',
		tags: ['ux', 'frontend', 'navigation'],
		relatedArticleSlugs: ['how-chatgpt-performs-deep-research'],
		relatedArticleTags: ['AI Wiki', 'SvelteKit']
	},
	{
		date: '2026-05-28',
		title: 'Pull the site accent from live signal',
		summary: 'Loaded the base color from the CN Tower lights feed and kept a blue fallback when the remote source is unavailable.',
		source: 'External data',
		accent: '#87dac4',
		tags: ['automation', 'signal', 'integration'],
		relatedArticleSlugs: ['ship-fast-for-windows-microsoft-store-playbook'],
		relatedArticleTags: ['Windows Store', 'Automation']
	},
	{
		date: '2026-05-27',
		title: 'Keep the content lane readable',
		summary:
			'Left the published surface focused on repair logs, research notes, and PixelBoats work instead of hiding everything behind a single generic blog feed.',
		source: 'AI Wiki',
		accent: '#ffcf77',
		tags: ['blog', 'content', 'readability'],
		relatedArticleSlugs: ['hermes-deepseek-setup'],
		relatedArticleTags: ['AI', 'Process']
	}
];

export const devLogEntries: DevLogEntry[] = devLogSeeds
	.map((entry) => ({
		...entry,
		tags: uniqueContentTags(entry.tags),
		relatedArticleSlugs: Array.from(new Set(entry.relatedArticleSlugs ?? [])),
		relatedArticleTags: uniqueContentTags(entry.relatedArticleTags ?? []),
		dateLabel: formatDevLogDate(entry.date)
	}))
	.sort((left, right) => right.date.localeCompare(left.date) || right.title.localeCompare(left.title));

export const devLogTags = uniqueContentTags(devLogEntries.flatMap((entry) => entry.tags));

export function devLogMatchesTag(entry: DevLogEntry, tag: string): boolean {
	const target = tag.trim();
	if (!target) return true;

	return entry.tags.some((candidate) => contentTagsMatch(candidate, target));
}

export function devLogMatchesArticleSlug(entry: DevLogEntry, slug: string): boolean {
	const target = normalizeSlug(slug);
	if (!target) return true;
	return entry.relatedArticleSlugs.some((candidate) => normalizeSlug(candidate) === target);
}

export function getDevLogEntriesForArticle(articleSlug: string, limit = 5): DevLogEntry[] {
	return devLogEntries.filter((entry) => devLogMatchesArticleSlug(entry, articleSlug)).slice(0, limit);
}

function formatDevLogDate(value: string): string {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}

function normalizeSlug(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\\/g, '')
		.replace(/\.md$/i, '')
		.replace(/\.[a-z0-9]+$/i, '')
		.replace(/_/g, '-')
		.replace(/\s+/g, '-');
}
