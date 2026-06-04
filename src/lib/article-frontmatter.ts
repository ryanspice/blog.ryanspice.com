export type FrontmatterValue = string | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

export type ArticleStatus = 'draft' | 'scheduled' | 'published';

export type ArticleVisual = {
	src: string;
	alt: string;
	credit?: string;
	sourceHref?: string;
	position?: string;
};

export type ArticleVisuals = {
	focal?: ArticleVisual;
	row?: ArticleVisual;
	background?: ArticleVisual;
};

export type FrontmatterUpdate = Record<string, string | undefined>;

const managedScalarKeys = [
	'status',
	'date',
	'updated_date',
	'publish_at',
	'release_date',
	'release_time',
	'accent',
	'design_accent',
	'image',
	'image_alt',
	'image_credit',
	'image_source',
	'image_position',
	'row_image',
	'row_image_alt',
	'row_image_credit',
	'row_image_source',
	'row_image_position',
	'background_image',
	'background_image_alt',
	'background_image_credit',
	'background_image_source',
	'background_image_position'
];

const preferredScalarOrder = [
	'title',
	'slug',
	'status',
	'draft_type',
	'date',
	'updated_date',
	'publish_at',
	'release_date',
	'release_time',
	'summary',
	'accent',
	'image',
	'image_alt',
	'image_credit',
	'image_source',
	'image_position',
	'row_image',
	'row_image_alt',
	'row_image_credit',
	'row_image_source',
	'row_image_position',
	'background_image',
	'background_image_alt',
	'background_image_credit',
	'background_image_source',
	'background_image_position'
];

export function splitFrontmatter(raw: string): { frontmatter: Frontmatter; body: string; hasFrontmatter: boolean } {
	const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) {
		return { frontmatter: {}, body: normalized, hasFrontmatter: false };
	}

	const end = normalized.indexOf('\n---', 4);
	if (end < 0) {
		return { frontmatter: {}, body: normalized, hasFrontmatter: false };
	}

	const yaml = normalized.slice(4, end);
	const body = normalized.slice(end + 4).trimStart();
	return { frontmatter: parseSimpleYaml(yaml), body, hasFrontmatter: true };
}

export function parseSimpleYaml(yaml: string): Frontmatter {
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

export function serializeFrontmatter(frontmatter: Frontmatter): string {
	const keys = Object.keys(frontmatter);
	const ordered = [
		...preferredScalarOrder.filter((key) => keys.includes(key)),
		...keys.filter((key) => !preferredScalarOrder.includes(key)).sort((left, right) => left.localeCompare(right))
	];

	return ordered
		.map((key) => serializeYamlPair(key, frontmatter[key]))
		.filter(Boolean)
		.join('\n');
}

export function updateFrontmatterText(raw: string, updates: FrontmatterUpdate): string {
	const { frontmatter, body } = splitFrontmatter(raw);
	const next: Frontmatter = { ...frontmatter };

	for (const key of managedScalarKeys) {
		if (!Object.hasOwn(updates, key)) continue;
		const value = updates[key]?.trim();
		if (value) next[key] = value;
		else delete next[key];
	}

	const yaml = serializeFrontmatter(next);
	return `---\n${yaml}\n---\n${body.trimStart()}`;
}

export function stringValue(value: FrontmatterValue | undefined): string {
	return typeof value === 'string' ? value : '';
}

export function arrayValue(value: FrontmatterValue | undefined): string[] {
	return Array.isArray(value) ? value : [];
}

export function normalizeArticleStatus(value: string | undefined): ArticleStatus {
	const status = (value ?? '').trim().toLowerCase();
	if (status === 'published') return 'published';
	if (status === 'scheduled') return 'scheduled';
	return 'draft';
}

export function isHexColor(value: string): boolean {
	return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export function articleVisualsFromFrontmatter(frontmatter: Frontmatter): ArticleVisuals {
	const focal = visualFromFrontmatter(frontmatter, 'image');
	const row = visualFromFrontmatter(frontmatter, 'row_image');
	const background = visualFromFrontmatter(frontmatter, 'background_image');

	return {
		...(focal ? { focal } : {}),
		...(row ? { row } : {}),
		...(background ? { background } : {})
	};
}

export function articlePublishDateTime(frontmatter: Frontmatter): string {
	const publishAt = stringValue(frontmatter.publish_at);
	if (publishAt) return publishAt;

	const releaseDate = stringValue(frontmatter.release_date);
	if (!releaseDate) return '';

	const releaseTime = stringValue(frontmatter.release_time);
	return releaseTime ? `${releaseDate}T${releaseTime}` : releaseDate;
}

function visualFromFrontmatter(frontmatter: Frontmatter, key: 'image' | 'row_image' | 'background_image'): ArticleVisual | undefined {
	const src = stringValue(frontmatter[key]);
	if (!src) return undefined;

	const alt = stringValue(frontmatter[`${key}_alt`]) || 'Article visual background image';
	const credit = stringValue(frontmatter[`${key}_credit`]);
	const sourceHref = stringValue(frontmatter[`${key}_source`]);
	const position = stringValue(frontmatter[`${key}_position`]);

	return {
		src,
		alt,
		...(credit ? { credit } : {}),
		...(sourceHref ? { sourceHref } : {}),
		...(position ? { position } : {})
	};
}

function serializeYamlPair(key: string, value: FrontmatterValue | undefined): string {
	if (typeof value === 'undefined') return '';

	if (Array.isArray(value)) {
		if (!value.length) return `${key}:`;
		return [`${key}:`, ...value.map((item) => `  - ${quoteYamlString(item)}`)].join('\n');
	}

	return `${key}: ${quoteYamlString(value)}`;
}

function quoteYamlString(value: string): string {
	const cleaned = value.trim();
	if (!cleaned) return '""';
	return `"${cleaned.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function cleanYamlValue(value: string): string {
	const trimmed = value.trim();
	const quote = trimmed[0];
	if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
		return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}
	return trimmed;
}
