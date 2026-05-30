const FALLBACK_ACCENT = '#1e9bff';
const LIVE_SOURCE = 'https://tower-lights.herokuapp.com/scheduleComplete';
const REPO_SOURCES = [
	'https://raw.githubusercontent.com/alexbelloni/cntowerlightsapi/master/routes/fakeDataFromCNTower.json',
	'https://raw.githubusercontent.com/alexbelloni/cntowerlightsapi/master/routes/fakeDataFromAPI.json'
];

let siteAccentPromise: Promise<string> | null = null;

export function resolveSiteAccent(): Promise<string> {
	if (!siteAccentPromise) {
		siteAccentPromise = loadSiteAccent();
	}

	return siteAccentPromise;
}

async function loadSiteAccent(): Promise<string> {
	for (const source of [LIVE_SOURCE, ...REPO_SOURCES]) {
		const accent = await fetchAccentFromSource(source);
		if (accent) return accent;
	}

	return FALLBACK_ACCENT;
}

async function fetchAccentFromSource(source: string): Promise<string | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 4000);

	try {
		const response = await fetch(source, {
			headers: { accept: 'application/json' },
			signal: controller.signal
		});

		if (!response.ok) {
			return null;
		}

		const payload: unknown = await response.json();
		const accent = extractFirstColour(payload);
		return accent && isSupportedColour(accent) ? accent : null;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

function extractFirstColour(payload: unknown): string | null {
	if (typeof payload === 'string') {
		return extractColourFromText(payload);
	}

	if (!Array.isArray(payload)) return null;

	for (const month of payload) {
		if (typeof month === 'string') {
			const accent = extractColourFromText(month);
			if (accent) return accent;
			continue;
		}

		if (!month || typeof month !== 'object') continue;

		const direct = extractColourFromText(Reflect.get(month as Record<string, unknown>, 'colourCaption'));
		if (direct) return direct;

		const dates = Reflect.get(month as Record<string, unknown>, 'dates');
		if (!Array.isArray(dates)) continue;

		for (const date of dates) {
			if (typeof date === 'string') {
				const accent = extractColourFromText(date);
				if (accent) return accent;
				continue;
			}

			if (!date || typeof date !== 'object') continue;

			const configs = Reflect.get(date as Record<string, unknown>, 'configs');
			if (!Array.isArray(configs)) continue;

			for (const config of configs) {
				if (!config || typeof config !== 'object') continue;

				const caption = extractColourFromText(Reflect.get(config as Record<string, unknown>, 'colourCaption'));
				if (caption) return caption;

				const colours = Reflect.get(config as Record<string, unknown>, 'colours');
				if (!Array.isArray(colours)) continue;

				for (const colour of colours) {
					const normalized = extractColourFromText(colour);
					if (normalized) {
						return normalized;
					}
				}
			}
		}
	}

	return null;
}

function isSupportedColour(value: string): boolean {
	if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true;
	if (/^(rgb|rgba|hsl|hsla)\(/i.test(value)) return true;

	return COLOR_KEYWORDS.has(value.toLowerCase());
}

function extractColourFromText(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (isSupportedColour(normalized)) return normalized;

	for (const token of normalized.split(/[^a-z#0-9]+/).filter(Boolean)) {
		if (isSupportedColour(token)) return token;
	}

	return null;
}

const COLOR_KEYWORDS = new Set([
	'blue',
	'green',
	'red',
	'purple',
	'yellow',
	'white',
	'orange',
	'pink',
	'cyan',
	'lime',
	'black',
	'gray',
	'grey',
	'silver',
	'brown',
	'teal',
	'navy',
	'maroon',
	'olive',
	'fuchsia',
	'magenta',
	'aqua'
]);
