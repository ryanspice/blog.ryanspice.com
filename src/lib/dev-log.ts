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
		date: '2026-06-29',
		title: 'Publish DeepSeek routing and code copy controls',
		summary:
			'Published a Windows PowerShell guide for routing Claude Code through DeepSeek, then tightened the article runtime with visual code-copy controls so technical notes are easier to use without weakening the privacy boundary around local agent setup.',
		source: 'DeepSeek Claude Code article and article runtime polish',
		accent: '#1e9bff',
		tags: ['blog', 'automation', 'deepseek', 'claude-code', 'windows', 'frontend', 'developer workflow'],
		relatedArticleSlugs: [
			'deepseek-claude-code-windows-powershell',
			'local-fugu-coding-harness',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'hermes-deepseek-setup'
		],
		relatedArticleTags: ['DeepSeek', 'AI agents', 'developer workflow', 'SvelteKit', 'Windows']
	},
	{
		date: '2026-06-25',
		title: 'Publish the Fugu harness and review the runtime surface',
		summary:
			'Moved the Local Fugu coding-harness article from draft framing into a published, visual build log, captured the PixelBoats pulse as a first-class automation signal, and recorded a local review pass across the blog and PHP-static adapter without exposing private source material.',
		source: 'Published Fugu article, PixelBoats pulse backstop, and local runtime review',
		accent: '#f4c273',
		tags: ['blog', 'automation', 'ai-wiki', 'hermes', 'pixelboats', 'sveltekit-php', 'seo'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'pixelboats-water-pipeline-pixi-webgl',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'AI Wiki', 'developer workflow', 'PixelBoats', 'SvelteKit', 'SEO']
	},
	{
		date: '2026-06-24',
		title: 'Turn Fugu orchestration into a build log',
		summary:
			'Drafted a Local Fugu coding-harness build log, then added the memory-unification run and audit so the article captures the conductor role map, cross-family verification rule, single-slot local model queue, and the human review loop that caught a real bridge defect.',
		source: 'Local Fugu build-log draft and workbench memory audit',
		accent: '#a3e635',
		tags: ['blog', 'automation', 'ai-wiki', 'hermes', 'ai', 'research', 'developer workflow'],
		relatedArticleSlugs: [
			'local-fugu-coding-harness',
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'hermes-deepseek-setup'
		],
		relatedArticleTags: ['AI', 'AI agents', 'AI Wiki', 'developer workflow', 'SvelteKit']
	},
	{
		date: '2026-06-22',
		title: 'Turn article publishing into dated routes',
		summary:
			'Added a GLM-5.2 Hermes delegation article, tightened the article publishing flow, aligned PHP-static build lanes, and introduced dated canonical article routes with tests so Ryan and Canopy can keep clearer crawl and sharing signals.',
		source: 'Weekend article publishing and routing hardening',
		accent: '#38bdf8',
		tags: ['blog', 'automation', 'ai', 'seo', 'sveltekit-php', 'canopy', 'developer workflow'],
		relatedArticleSlugs: [
			'glm-5-2-hermes-cloudflare-workers-ai-delegation',
			'glm-5-2-long-context-search-exposure',
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'SvelteKit', 'SEO', 'Social media', 'developer workflow']
	},
	{
		date: '2026-06-19',
		title: 'Publish Nemotron and harden social metadata',
		summary:
			'Published the Nemotron production-setup article, added RSS/OG/Twitter parity across Ryan and Canopy routes, regenerated social-card metadata, and added structured-schema fixes for low-friction discovery.',
		source: 'Nemotron article release and metadata hardening',
		accent: '#0ea5e9',
		tags: ['blog', 'automation', 'ai', 'seo', 'sveltekit-php', 'canopy'],
		relatedArticleSlugs: [
			'nvidia-nemotron-3-ultra-hermes-agent-production-setup',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'how-chatgpt-performs-deep-research',
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'ship-fast-for-windows-microsoft-store-playbook'
		],
		relatedArticleTags: ['AI', 'AI agents', 'SvelteKit', 'SEO', 'Social media', 'developer workflow']
	},
	{
		date: '2026-06-18',
		title: 'Publish the GLM search-exposure note',
		summary:
			'Published a source-grounded GLM-5.2 article about long-context coding agents, search exposure, provider limits, and retrieval discipline, then refined the Canopy theme so the second public surface keeps a clearer branded reading lane.',
		source: 'Model research article and Canopy theme polish',
		accent: '#22c55e',
		tags: ['blog', 'automation', 'ai', 'research', 'seo', 'canopy', 'developer workflow'],
		relatedArticleSlugs: [
			'glm-5-2-long-context-search-exposure',
			'how-chatgpt-performs-deep-research',
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'a-love-of-digital-technology-bridges-canopy-into-the-fold'
		],
		relatedArticleTags: ['AI', 'AI agents', 'developer workflow', 'SEO', 'SvelteKit']
	},
	{
		date: '2026-06-16',
		title: 'Add the Canopy build identity lane',
		summary:
			'Added a Canopy-branded blog build with its own article, theme, deploy examples, RSS/sitemap identity handling, and PHP-static guardrails so the same content engine can ship a second public surface without mixing owner-only notes into the release lane.',
		source: 'Canopy blog build and PHP-static identity hardening',
		accent: '#7fd1b9',
		tags: ['blog', 'automation', 'sveltekit-php', 'canopy', 'seo', 'release', 'developer workflow'],
		relatedArticleSlugs: [
			'a-love-of-digital-technology-bridges-canopy-into-the-fold',
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'ship-fast-for-windows-microsoft-store-playbook',
			'openjarvis-local-ai-personal-ai-on-your-pc'
		],
		relatedArticleTags: ['SvelteKit', 'SEO', 'developer workflow', 'AI', 'Windows Store']
	},
	{
		date: '2026-06-15',
		title: 'Ship the fallback article and release lane',
		summary:
			'Published the Fable fallback plan, corrected the article lane, tightened production verification around the PHP-static release path, and polished the site motion layer without turning private agent notes into public source material.',
		source: 'Weekend blog publishing and release hardening',
		accent: '#8cc8ff',
		tags: ['blog', 'automation', 'privacy', 'ai-wiki', 'sveltekit-php', 'developer workflow', 'frontend'],
		relatedArticleSlugs: [
			'if-fable-5-is-gone-agent-stack-fallback-plan',
			'agent-mixing-deepseek-pro-flash-gemma4-diminishing-returns',
			'hermes-deepseek-setup',
			'recover-deepseek-gui-conversations-after-update',
			'openjarvis-local-ai-personal-ai-on-your-pc',
			'pixelboats-water-pipeline-pixi-webgl'
		],
		relatedArticleTags: ['AI agents', 'DeepSeek', 'AI Wiki', 'SvelteKit', 'developer workflow', 'PixelBoats']
	},
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
