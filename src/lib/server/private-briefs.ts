import { renderMarkdown, slugify } from '../markdown';
import {
	formatBriefDate,
	isVisibleMorningBrief,
	type PrivateMorningBrief
} from '../morning-briefs';

type RawBriefModule = Record<string, string>;

// This module must stay under src/lib/server. It is the only place that reads
// private morning-brief Markdown eagerly. The build script loads it through
// Vite SSR and writes the resulting private payload outside the deployable
// build directory, next to the private article payload.
const modules = import.meta.glob('../content/morning-briefs/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawBriefModule;

const parsedBriefs = await Promise.all(
	Object.entries(modules).map(([path, raw]) => parseMorningBrief(path, raw))
);

export const privateBriefs: PrivateMorningBrief[] = parsedBriefs.sort(
	(left, right) =>
		right.date.localeCompare(left.date) || left.title.localeCompare(right.title)
);

export const visiblePrivateBriefs: PrivateMorningBrief[] = privateBriefs.filter(isVisibleMorningBrief);

export const privateBriefSlugs: string[] = visiblePrivateBriefs.map((brief) => brief.slug).sort();

async function parseMorningBrief(path: string, raw: string): Promise<PrivateMorningBrief> {
	const { frontmatter, body } = splitFrontmatter(raw);
	const filename = path.split('/').pop()?.replace(/\.md$/, '') ?? 'morning-brief';
	const title = stringValue(frontmatter.title) || firstHeading(body) || filename;
	const slug =
		stringValue(frontmatter.slug) ||
		filename.replace(/^\d{4}-\d{2}-\d{2}-/, '') ||
		slugify(title);
	const date =
		stringValue(frontmatter.date) ||
		filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ||
		'2026-06-04';
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
			result[activeKey] = [
				...(Array.isArray(current) ? current : []),
				cleanYamlValue(listItem[1])
			];
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
	return value
		.trim()
		.replace(/^[ '\"]|[ '\"]$/g, '')
		.replace(/^['\"]|['\"]$/g, '');
}

function stringValue(value: string | string[] | undefined): string {
	return typeof value === 'string' ? value : '';
}

function arrayValue(value: string | string[] | undefined): string[] {
	return Array.isArray(value) ? value : [];
}

function firstHeading(body: string): string | undefined {
	return body.match(/^#\s+(.+)$/m)?.[1]?.trim();
}
