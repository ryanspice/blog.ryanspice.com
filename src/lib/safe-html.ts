declare const safeHtmlBrand: unique symbol;

export type SafeHtml = string & {
	readonly [safeHtmlBrand]: true;
};

const SAFE_INLINE_TAG = /<\/?(?:strong|em|code|br)\s*\/?>/gi;

export function markSafeHtml(html: string): SafeHtml {
	return html as SafeHtml;
}

export function jsonLdScriptText(value: unknown): SafeHtml {
	return markSafeHtml(
		(JSON.stringify(value) ?? 'null')
			.replace(/</g, '\\u003c')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029')
	);
}

export function jsonLdScriptHtml(value: unknown): SafeHtml {
	return markSafeHtml(`<script type="application/ld+json">${jsonLdScriptText(value)}</script>`);
}

export function safeInlineHtml(html: string): SafeHtml {
	let output = '';
	let index = 0;

	for (const match of html.matchAll(SAFE_INLINE_TAG)) {
		const matchIndex = match.index ?? 0;
		output += escapeHtml(html.slice(index, matchIndex));
		output += normalizeInlineTag(match[0]);
		index = matchIndex + match[0].length;
	}

	output += escapeHtml(html.slice(index));
	return markSafeHtml(output);
}

export function sanitizeTrustedSvg(svg: string): SafeHtml {
	return markSafeHtml(
		svg
			.replace(/<script[\s\S]*?<\/script>/gi, '')
			.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
			.replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, '')
			.replace(/\s(?:href|xlink:href)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '')
	);
}

function normalizeInlineTag(tag: string): string {
	const name = tag.match(/^<\/?\s*([a-z]+)/i)?.[1]?.toLowerCase();
	if (!name) return '';
	if (name === 'br') return '<br>';
	return tag.startsWith('</') ? `</${name}>` : `<${name}>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
