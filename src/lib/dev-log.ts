import { contentTagsMatch, uniqueContentTags } from './tags';
import { slugify } from './markdown';

export type DevLogEntry = {
	id: string;
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

type DevLogSeed = Omit<DevLogEntry, 'id' | 'dateLabel'>;

const devLogSeeds: DevLogSeed[] = [
	{
		date: '2026-06-09',
		title: 'Publish a DeepSeek GUI recovery guide',
		summary:
			'Turned a raw DeepSeek GUI update-recovery note into a public, backup-first Windows guide with sanitized paths, stock imagery, source links, and safer cleanup guidance for local-first AI workspace users.',
		source: 'DeepSeek GUI recovery article release',
		accent: '#10b981',
		tags: ['blog', 'deepseek', 'windows', 'local-first', 'data recovery', 'developer workflow'],
		relatedArticleSlugs: [
			'recover-deepseek-gui-conversations-after-update',
			'hermes-deepseek-setup',
			'what-can-you-actually-do-with-a-deepseek-api-key'
		],
		relatedArticleTags: ['DeepSeek', 'Windows', 'AI agents', 'developer workflow']
	},
	{
		date: '2026-06-09',
		title: 'Shift public controls into the static runtime',
		summary:
			'Moved article reading controls, copy actions, same-origin back links, scroll progress, and table-of-contents state into a small prerender-friendly runtime, then tightened locale routing so hash links stay local while translated paths remain prefixed.',
		source: 'Blog prerendered interactivity and locale routing',
		accent: '#9ad7a5',
		tags: ['blog', 'sveltekit-php', 'frontend', 'i18n', 'testing', 'automation'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'phaser-vs-pixijs-2026-choosing-for-2-5d-multiplayer-seafaring-game',
			'pixelboats-water-pipeline-pixi-webgl'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'developer workflow', 'PixelBoats']
	},
	{
		date: '2026-06-08',
		title: 'Map the multilingual and gated blog surface',
		summary:
			'Added locale-aware routing and French pilot content, cataloged the site with desktop/mobile screenshots, and hardened owner-gated auth controls so runtime failures surface in-page instead of leaking into console-only errors.',
		source: 'Blog i18n, catalog, and auth workflow',
		accent: '#8cc8ff',
		tags: ['blog', 'sveltekit-php', 'i18n', 'automation', 'privacy', 'testing'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'pixelboats-water-pipeline-pixi-webgl',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'AI', 'developer workflow', 'PixelBoats']
	},
	{
		date: '2026-06-05',
		title: 'Stabilize the blog delivery surface',
		summary:
			'Tightened the static/PHP rendering path, chased down hydration flicker, restored homepage article accents, and kept the article/research lanes searchable without exposing private source material.',
		source: 'Blog delivery and content workflow',
		accent: '#7fd1b9',
		tags: ['blog', 'sveltekit-php', 'frontend', 'automation', 'research'],
		relatedArticleSlugs: [
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['SvelteKit', 'AI', 'developer workflow', 'SEO']
	},
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
		id: makeDevLogId(entry),
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

function makeDevLogId(entry: DevLogSeed): string {
	return `${entry.date}-${slugify(entry.title)}-${entry.title.length}`;
}
