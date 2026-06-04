const TAG_ALIAS_GROUPS: Record<string, string[]> = {
	'2.5d rendering': ['2.5d rendering', '2.5d', '2-5d rendering'],
	'ai agents': ['ai agents', 'ai agent', 'ai agent framework', 'agentic workflows', 'local ai agent', 'personal ai'],
	'ai assistants': ['ai assistants', 'ai assistant', 'claude code', 'chatgpt', 'codex'],
	'ai coding': ['ai coding', 'coding agents', 'code agents'],
	'ai wiki': ['ai wiki', 'ai-wiki'],
	'agent orchestration': ['agent orchestration', 'model orchestration', 'agent mixing'],
	'book publishing': ['book publishing', 'book marketing', 'publishing'],
	'creative tooling': ['creative tooling', 'desktop tooling'],
	'developer workflow': ['developer workflow', 'developer-workflow', 'developer experience', 'ai workflow', 'creator workflow'],
	deepseek: ['deepseek', 'deepseek api'],
	'desktop apps': ['desktop apps', 'desktop-apps', 'windows apps'],
	'dll debugging': ['dll debugging', 'dll-debugging', 'dlls'],
	'gimp 3': ['gimp', 'gimp 3', 'gimp-3', 'gimp 3.2'],
	gmic: ['gmic', "g'mic", "g'mic-qt"],
	'indie game dev': ['indie game dev', 'indie game development', 'game dev'],
	'local ai': ['local ai', 'run ai locally', 'open-source ai', 'on-device ai'],
	'model routing': ['model routing', 'agent routing'],
	openjarvis: ['openjarvis', '#openjarvis', 'open jarvis'],
	'open-source ai': ['open-source ai', 'open source ai'],
	'pixel art': ['pixel art', 'pixel-art'],
	pixelboats: ['pixelboats', 'pixel boats'],
	'product strategy': ['product strategy', 'product-strategy'],
	'programmatic video': ['programmatic video', 'react video'],
	remotion: ['remotion', '@remotion/player'],
	sveltekit: ['sveltekit', 'sveltekit 2'],
	'water simulation': ['water simulation', 'water rendering'],
	webgl: ['webgl', 'webgl2'],
	windows: ['windows', 'windows 11', 'windows-11'],
	'windows store': ['windows store', 'microsoft store']
};

const TAG_ALIAS_REVERSE: Record<string, string> = {};

for (const [canonical, aliases] of Object.entries(TAG_ALIAS_GROUPS)) {
	TAG_ALIAS_REVERSE[normalizeTagKey(canonical)] = normalizeTagKey(canonical);
	for (const alias of aliases) {
		TAG_ALIAS_REVERSE[normalizeTagKey(alias)] = normalizeTagKey(canonical);
	}
}

export function normalizeContentTag(value: string): string {
	const cleaned = normalizeTagKey(value);
	return TAG_ALIAS_REVERSE[cleaned] ?? cleaned;
}

export function contentTagsMatch(left: string, right: string): boolean {
	return normalizeContentTag(left) === normalizeContentTag(right);
}

export function uniqueContentTags(tags: string[]): string[] {
	const seen = new Set<string>();
	const values: string[] = [];

	for (const tag of tags) {
		const cleaned = tag.trim();
		if (!cleaned) continue;

		const normalized = normalizeContentTag(cleaned);
		if (seen.has(normalized)) continue;

		seen.add(normalized);
		values.push(cleaned);
	}

	return values.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
}

function normalizeTagKey(value: string): string {
	return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}
