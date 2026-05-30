export type DevLogLink = {
	label: string;
	href: string;
};

export type DevLogEntry = {
	date: string;
	dateLabel: string;
	title: string;
	summary: string;
	fragment: string;
	source: string;
	accent: string;
	tags: string[];
	links?: DevLogLink[];
};

type DevLogSeed = Omit<DevLogEntry, 'dateLabel'>;

const devLogSeeds: DevLogSeed[] = [
	{
		date: '2026-05-30',
		title: 'Seed the public dev log',
		summary:
			'Added a lightweight place for blog work that can sit between AI Wiki fragments, repo notes, and future command summaries.',
		fragment: 'AI Wiki fragment',
		source: 'Blog process',
		accent: '#1e9bff',
		tags: ['AI Wiki', 'Fragments', 'Process'],
		links: [{ label: 'Drafts', href: '/drafts' }]
	},
	{
		date: '2026-05-29',
		title: 'Keep unpublished work in its own lane',
		summary:
			'Added /drafts so unfinished pieces stay separate from the public homepage while still being easy to review.',
		fragment: 'Unpublished queue',
		source: 'SvelteKit route',
		accent: '#53b8ff',
		tags: ['Drafts', 'Publishing', 'Static site'],
		links: [{ label: 'Drafts', href: '/drafts' }]
	},
	{
		date: '2026-05-29',
		title: 'Make article navigation feel continuous',
		summary:
			'Wired article titles into native view transitions so clicks move the title into the reading page instead of hard-cutting.',
		fragment: 'Navigation polish',
		source: 'UX pass',
		accent: '#f2d27c',
		tags: ['View transitions', 'UX', 'Svelte'],
		links: [{ label: 'Latest article', href: '/how-chatgpt-performs-deep-research' }]
	},
	{
		date: '2026-05-28',
		title: 'Pull the site accent from live signal',
		summary:
			'Loaded the base color from the CN Tower lights feed and kept a blue fallback when the remote source is unavailable.',
		fragment: 'CN Tower signal',
		source: 'External data',
		accent: '#87dac4',
		tags: ['Accent', 'Fallback', 'Branding'],
		links: [{ label: 'Home', href: '/' }]
	},
	{
		date: '2026-05-27',
		title: 'Keep the content lane readable',
		summary:
			'Left the published surface focused on repair logs, research notes, and PixelBoats work instead of hiding everything behind a single generic blog feed.',
		fragment: 'Content lane',
		source: 'AI Wiki',
		accent: '#ffcf77',
		tags: ['Articles', 'AI Wiki', 'Workflow'],
		links: [{ label: 'Articles', href: '/#articles' }]
	}
];

export const devLogEntries: DevLogEntry[] = devLogSeeds
	.map((entry) => ({
		...entry,
		dateLabel: formatDevLogDate(entry.date)
	}))
	.sort((left, right) => right.date.localeCompare(left.date) || right.title.localeCompare(left.title));

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
