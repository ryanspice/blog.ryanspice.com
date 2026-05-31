export type TocItem = {
	id: string;
	text: string;
	level: 2 | 3;
};

export type RenderedMarkdown = {
	html: string;
	toc: TocItem[];
	wordCount: number;
	readingMinutes: number;
};

export type MarkdownLinkTerm = {
	label: string;
	href: string;
};

type RenderMarkdownOptions = {
	linkTerms?: MarkdownLinkTerm[];
};

const SELF_CLOSING_BOUNDARY = /^\s*$/;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const LINK_EXCLUDED_TAGS = new Set(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'math', 'pre', 'script', 'style', 'svg']);

export function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): RenderedMarkdown {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	const sectionBlocks: string[] = [];
	const toc: TocItem[] = [];
	let i = 0;
	let wordCount = 0;
	let renderedLeadParagraph = false;
	let sectionActive = false;
	let sectionCount = 0;

	function pushBlock(block: string): void {
		if (sectionActive) {
			sectionBlocks.push(block);
			return;
		}

		html.push(block);
	}

	function flushSection(): void {
		if (!sectionActive || !sectionBlocks.length) return;
		const isLeadSection = sectionCount === 0;
		html.push(
			`<section class="article-section${isLeadSection ? ' article-section--lead' : ''}"><div class="article-section-body">${sectionBlocks.join('\n')}</div>${isLeadSection ? renderLeadSectionArt() : ''}</section>`
		);
		sectionBlocks.length = 0;
		sectionCount += 1;
	}

	while (i < lines.length) {
		const line = lines[i] ?? '';

		if (SELF_CLOSING_BOUNDARY.test(line)) {
			i += 1;
			continue;
		}

		const fence = line.match(/^```\s*([\w-]+)?\s*$/);
		if (fence) {
			const lang = fence[1] || 'text';
			const block: string[] = [];
			i += 1;
			while (i < lines.length && !/^```\s*$/.test(lines[i] ?? '')) {
				block.push(lines[i] ?? '');
				i += 1;
			}
			i += 1;
			if (/^mermaid$/i.test(lang)) {
				pushBlock(`<div class="mermaid-diagram code-block" data-lang="${escapeAttr(lang)}">${escapeHtml(block.join('\n'))}</div>`);
				continue;
			}
			pushBlock(`<pre class="code-block" data-lang="${escapeAttr(lang)}"><code>${highlightCode(block.join('\n'), lang)}</code></pre>`);
			continue;
		}

		const h1 = line.match(/^#\s+(.+)$/);
		if (h1) {
			const text = stripInlineMarkdown(h1[1].trim());
			const id = slugify(text);
			pushBlock(`<h1 id="${id}">${inline(h1[1].trim())}</h1>`);
			i += 1;
			continue;
		}

		const heading = line.match(/^(#{2,3})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length as 2 | 3;
			const text = stripInlineMarkdown(heading[2].trim());
			const id = uniqueSlug(text, toc.map((item) => item.id));
			toc.push({ id, text, level });
			if (level === 2) {
				if (sectionActive) flushSection();
				sectionActive = true;
			}
			pushBlock(`<h${level} id="${id}">${inline(heading[2].trim())}</h${level}>`);
			i += 1;
			continue;
		}

		if (isTableStart(lines, i)) {
			const rows: string[][] = [];
			const header = splitTableLine(lines[i]);
			i += 2;
			while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i] ?? '')) {
				rows.push(splitTableLine(lines[i] ?? ''));
				i += 1;
			}
			pushBlock(renderTable(header, rows));
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '')) {
				items.push((lines[i] ?? '').replace(/^\s*[-*]\s+/, ''));
				i += 1;
			}
			pushBlock(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
			continue;
		}

		if (/^\s*\d+\.\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
				items.push((lines[i] ?? '').replace(/^\s*\d+\.\s+/, ''));
				i += 1;
			}
			pushBlock(`<ol>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>`);
			continue;
		}

		if (/^>\s?/.test(line)) {
			const block: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
				block.push((lines[i] ?? '').replace(/^>\s?/, ''));
				i += 1;
			}
			pushBlock(`<blockquote class="article-callout">${block.map((part) => `<p>${inline(part)}</p>`).join('')}</blockquote>`);
			continue;
		}

		const paragraph: string[] = [];
		while (
			i < lines.length &&
			!SELF_CLOSING_BOUNDARY.test(lines[i] ?? '') &&
			!/^```/.test(lines[i] ?? '') &&
			!/^(#{1,3})\s+/.test(lines[i] ?? '') &&
			!/^\s*[-*]\s+/.test(lines[i] ?? '') &&
			!/^\s*\d+\.\s+/.test(lines[i] ?? '') &&
			!isTableStart(lines, i)
		) {
			paragraph.push((lines[i] ?? '').trim());
			i += 1;
		}

		const text = paragraph.join(' ');
		wordCount += text.split(/\s+/).filter(Boolean).length;
		pushBlock(renderParagraph(text, renderedLeadParagraph));
		renderedLeadParagraph = true;
	}

	flushSection();

	const structuredHtml = html.join('\n');
	const linkedHtml = options.linkTerms?.length ? linkFirstOccurrences(structuredHtml, options.linkTerms) : structuredHtml;
	const renderedHtml = autoLinkUrls(linkedHtml);

	return {
		html: renderedHtml,
		toc,
		wordCount,
		readingMinutes: Math.max(1, Math.ceil(wordCount / 220))
	};
}

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'section';
}

function normalizeArticleTarget(value: string): string {
	return slugify(
		value
			.replace(/\.md$/i, '')
			.replace(/^\d{4}-\d{2}-\d{2}-/, '')
	);
}

function uniqueSlug(text: string, existing: string[]): string {
	const base = slugify(text);
	let slug = base;
	let index = 2;
	while (existing.includes(slug)) {
		slug = `${base}-${index}`;
		index += 1;
	}
	return slug;
}

function isTableStart(lines: string[], index: number): boolean {
	return /^\s*\|.+\|\s*$/.test(lines[index] ?? '') && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? '');
}

function splitTableLine(line: string): string[] {
	return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function renderTable(header: string[], rows: string[][]): string {
	return `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows
		.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
		.join('')}</tbody></table></div>`;
}

function linkFirstOccurrences(html: string, linkTerms: MarkdownLinkTerm[]): string {
	const linked = new Set<string>();
	const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
	const stack: string[] = [];
	const terms = linkTerms
		.map((term) => ({
			label: term.label.trim(),
			href: term.href.trim(),
			key: term.label.trim().toLowerCase()
		}))
		.filter((term) => term.label.length > 0 && term.href.length > 0)
		.sort((left, right) => right.label.length - left.label.length || left.label.localeCompare(right.label));

	return tokens
		.map((token) => {
			if (token.startsWith('<')) {
				updateTagStack(token, stack);
				return token;
			}

			if (stack.some((tag) => LINK_EXCLUDED_TAGS.has(tag))) {
				return token;
			}

			let output = token;
			for (const term of terms) {
				if (linked.has(term.key)) continue;

				const pattern = new RegExp(
					`(^|[^A-Za-z0-9-])(${escapeRegExp(term.label)})(?=$|[^A-Za-z0-9-])`,
					'i'
				);

				if (!pattern.test(output)) continue;

				output = output.replace(pattern, (_match, prefix: string, matched: string) => {
					linked.add(term.key);
					const external = term.href.startsWith('http');
					const link = `<a class="wiki-link ${external ? 'external-link' : 'internal-link'}" href="${escapeAttr(term.href)}"${
						external ? ' rel="noreferrer" target="_blank"' : ''
					}>${escapeHtml(matched)}</a>`;
					return `${prefix}${link}`;
				});
			}

			return output;
		})
		.join('');
}

function autoLinkUrls(html: string): string {
	const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
	const stack: string[] = [];

	return tokens
		.map((token) => {
			if (token.startsWith('<')) {
				updateTagStack(token, stack);
				return token;
			}

			if (stack.some((tag) => LINK_EXCLUDED_TAGS.has(tag))) {
				return token;
			}

			return token.replace(/(?:https?:\/\/|www\.)[^\s<]+/g, (rawUrl) => {
				const trimmed = rawUrl.replace(/[)\].,!?;:]+$/g, '');
				const suffix = rawUrl.slice(trimmed.length);
				const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
				return `<a class="wiki-link external-link" href="${escapeAttr(href)}" rel="noreferrer" target="_blank">${escapeHtml(trimmed)}</a>${escapeHtml(suffix)}`;
			});
		})
		.join('');
}

function updateTagStack(token: string, stack: string[]): void {
	const match = token.match(/^<\/?\s*([a-zA-Z0-9:-]+)(?:\s[^>]*)?>$/);
	if (!match) return;

	const tag = match[1].toLowerCase();
	if (token.startsWith('</')) {
		const index = stack.lastIndexOf(tag);
		if (index >= 0) stack.splice(index);
		return;
	}

	if (VOID_TAGS.has(tag) || token.endsWith('/>')) return;
	stack.push(tag);
}

function renderParagraph(value: string, isLead: boolean): string {
	if (!isLead) {
		return `<p>${inline(value)}</p>`;
	}

	const leadSentence = value.match(/^(.+?[.!?])(\s+.+)?$/);
	if (!leadSentence) {
		return `<p class="article-lede">${inline(value)}</p>`;
	}

	const firstSentence = leadSentence[1];
	const remaining = leadSentence[2]?.trim() ?? '';
	return `<p class="article-lede"><span class="article-lede-sentence">${inline(firstSentence)}</span>${remaining ? ` ${inline(remaining)}` : ''}</p>`;
}

function inline(value: string): string {
	let output = escapeHtml(value);

	output = output.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_match, target, label) => {
		const slug = normalizeArticleTarget(String(target));
		return `<a class="wiki-link internal-link" href="../${slug}/">${escapeHtml(String(label))}</a>`;
	});
	output = output.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a class="wiki-link external-link" href="$2" rel="noreferrer" target="_blank">$1</a>'
	);
	output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
	output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');

	return output;
}

function highlightCode(value: string, lang: string): string {
	const escaped = escapeHtml(value);
	if (!/^(powershell|ps1|pwsh)$/i.test(lang)) return escaped;

	return escaped
		.replace(/("[^"\n]*")/g, '<span class="tok-string">$1</span>')
		.replace(/(\$[A-Za-z_][\w:]*)/g, '<span class="tok-var">$1</span>')
		.replace(/\b(Get-ChildItem|Set-Location|Join-Path|Test-Path|Remove-Item|New-Item|Copy-Item|Move-Item|Start-Process|Write-Host|where\.exe|pnpm|corepack|pwsh|tar|robocopy)\b/g, '<span class="tok-command">$1</span>')
		.replace(/(#.*)$/gm, '<span class="tok-comment">$1</span>');
}

function stripInlineMarkdown(value: string): string {
	return value
		.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
		.replace(/[`*_]/g, '');
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/`/g, '&#096;');
}

function renderLeadSectionArt(): string {
	return `
		<div class="article-section-art" aria-hidden="true">
			<svg viewBox="0 0 320 240" focusable="false" aria-hidden="true">
				<defs>
					<linearGradient id="lead-grid" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="currentColor" stop-opacity="0.12" />
						<stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
					</linearGradient>
				</defs>
				<rect x="22" y="18" width="276" height="204" rx="24" fill="url(#lead-grid)" opacity="0.9" />
				<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
					<rect x="176" y="28" width="92" height="92" rx="14" opacity="0.26" stroke-width="1.4" />
					<rect x="124" y="76" width="106" height="106" rx="16" opacity="0.45" stroke-width="1.6" />
					<rect x="64" y="126" width="124" height="70" rx="16" opacity="0.78" stroke-width="1.8" />
					<path d="M64 162H188" opacity="0.34" stroke-width="1.3" />
					<path d="M124 118H230" opacity="0.28" stroke-width="1.3" />
					<path d="M176 74H268" opacity="0.22" stroke-width="1.3" />
				</g>
				<g fill="currentColor" opacity="0.22">
					<circle cx="88" cy="58" r="2.2" />
					<circle cx="105" cy="39" r="1.6" />
					<circle cx="244" cy="48" r="1.8" />
					<circle cx="214" cy="184" r="2.1" />
				</g>
			</svg>
		</div>
	`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
