import { renderMarkdown, slugify, type RenderedMarkdown } from './markdown';

type RawBriefModule = Record<string, string>;

export type MorningBriefMeta = {
	title: string;
	slug: string;
	date: string;
	dateLabel: string;
	summary: string;
	tags: string[];
	projects: string[];
	status: string;
};

export type MorningBrief = MorningBriefMeta & RenderedMarkdown & {
	body: string;
};

const modules = import.meta.glob('./content/morning-briefs/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawBriefModule;

export const morningBriefs: MorningBrief[] = (
	await Promise.all(Object.entries(modules).map(([path, raw]) => parseMorningBrief(path, raw)))
).sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title));

export const visibleMorningBriefs = morningBriefs.filter((brief) => brief.status !== 'archived');
export const morningBriefTags = Array.from(new Set(visibleMorningBriefs.flatMap((brief) => brief.tags))).sort(
	(left, right) => left.localeCompare(right)
);

export function getMorningBrief(slug: string): MorningBrief | undefined {
	return morningBriefs.find((brief) => brief.slug === slug);
}

export function morningBriefSearchText(brief: Pick<MorningBrief, 'title' | 'summary' | 'tags' | 'projects'>): string {
	return [brief.title, brief.summary, ...brief.tags, ...brief.projects].join(' ').toLowerCase();
}

async function parseMorningBrief(path: string, raw: string): Promise<MorningBrief> {
	const { frontmatter, body } = splitFrontmatter(raw);
	const filename = path.split('/').pop()?.replace(/\.md$/, '') ?? 'morning-brief';
	const title = stringValue(frontmatter.title) || firstHeading(body) || filename;
	const slug = stringValue(frontmatter.slug) || filename.replace(/^\d{4}-\d{2}-\d{2}-/, '') || slugify(title);
	const date = stringValue(frontmatter.date) || filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '2026-06-04';
	const rendered = await renderMarkdown(body);

	return {
		...rendered,
		title,
		slug,
		date,
		dateLabel: formatBriefDate(date),
		summary: stringValue(frontmatter.summary),
		tags: arrayValue(frontmatter.tags),
		projects: arrayValue(frontmatter.projects),
		status: stringValue(frontmatter.status) || 'private',
		body
	};
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

function formatBriefDate(value: string): string {
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
