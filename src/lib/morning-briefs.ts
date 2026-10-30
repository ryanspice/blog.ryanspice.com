import type { RenderedMarkdown } from './markdown';

// This module is intentionally client-safe. It contains shared types and pure
// helpers only. Raw morning-brief Markdown is read by the server-only module
// src/lib/server/private-briefs.ts and delivered by the owner PHP endpoint.
// Never add import.meta.glob, raw Markdown imports, or private data here.

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

export type MorningBrief = MorningBriefMeta & RenderedMarkdown;

export type PrivateMorningBrief = MorningBrief & {
	body: string;
};

export function isVisibleMorningBrief(brief: Pick<MorningBrief, 'status'>): boolean {
	return brief.status !== 'archived';
}

export function morningBriefSearchText(
	brief: Pick<MorningBriefMeta, 'title' | 'summary' | 'tags' | 'projects'>
): string {
	return [brief.title, brief.summary, ...brief.tags, ...brief.projects].join(' ').toLowerCase();
}

export function collectMorningBriefTags(
	briefs: ReadonlyArray<Pick<MorningBriefMeta, 'tags'>>
): string[] {
	return Array.from(new Set(briefs.flatMap((brief) => brief.tags))).sort((left, right) =>
		left.localeCompare(right)
	);
}

export function filterMorningBriefs(
	briefs: ReadonlyArray<MorningBrief>,
	tag: string,
	query: string
): MorningBrief[] {
	const normalizedTag = tag.trim().toLowerCase();
	const normalizedQuery = query.trim().toLowerCase();

	return briefs.filter((brief) => {
		if (normalizedTag && !brief.tags.some((briefTag) => briefTag.toLowerCase() === normalizedTag)) {
			return false;
		}

		if (normalizedQuery && !morningBriefSearchText(brief).includes(normalizedQuery)) {
			return false;
		}

		return true;
	});
}

export function formatBriefDate(value: string): string {
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return value;

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(parsed);
}
