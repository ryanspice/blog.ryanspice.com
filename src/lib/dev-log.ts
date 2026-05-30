export type DevLogEntry = {
	date: string;
	dateLabel: string;
	title: string;
	summary: string;
	source: string;
	accent: string;
};

type DevLogSeed = Omit<DevLogEntry, 'dateLabel'>;

const devLogSeeds: DevLogSeed[] = [
	{
		date: '2026-05-30',
		title: 'Seed the public dev log',
		summary:
			'Added a lightweight place for blog work, repo notes, and future command summaries.',
		source: 'Blog process',
		accent: '#1e9bff',
	},
	{
		date: '2026-05-29',
		title: 'Keep unpublished work in its own lane',
		summary:
			'Added /drafts so unfinished pieces stay separate from the public homepage while still being easy to review.',
		source: 'SvelteKit route',
		accent: '#53b8ff',
	},
	{
		date: '2026-05-29',
		title: 'Make article navigation feel continuous',
		summary:
			'Wired article titles into native view transitions so clicks move the title into the reading page instead of hard-cutting.',
		source: 'UX pass',
		accent: '#f2d27c',
	},
	{
		date: '2026-05-28',
		title: 'Pull the site accent from live signal',
		summary:
			'Loaded the base color from the CN Tower lights feed and kept a blue fallback when the remote source is unavailable.',
		source: 'External data',
		accent: '#87dac4',
	},
	{
		date: '2026-05-27',
		title: 'Keep the content lane readable',
		summary:
			'Left the published surface focused on repair logs, research notes, and PixelBoats work instead of hiding everything behind a single generic blog feed.',
		source: 'AI Wiki',
		accent: '#ffcf77',
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
