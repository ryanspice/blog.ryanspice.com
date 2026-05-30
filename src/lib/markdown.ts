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

const SELF_CLOSING_BOUNDARY = /^\s*$/;

export function renderMarkdown(markdown: string): RenderedMarkdown {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	const toc: TocItem[] = [];
	let i = 0;
	let wordCount = 0;

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
			html.push(`<pre class="code-block" data-lang="${escapeAttr(lang)}"><code>${highlightCode(block.join('\n'), lang)}</code></pre>`);
			continue;
		}

		const h1 = line.match(/^#\s+(.+)$/);
		if (h1) {
			const text = stripInlineMarkdown(h1[1].trim());
			const id = slugify(text);
			html.push(`<h1 id="${id}">${inline(h1[1].trim())}</h1>`);
			i += 1;
			continue;
		}

		const heading = line.match(/^(#{2,3})\s+(.+)$/);
		if (heading) {
			const level = heading[1].length as 2 | 3;
			const text = stripInlineMarkdown(heading[2].trim());
			const id = uniqueSlug(text, toc.map((item) => item.id));
			toc.push({ id, text, level });
			html.push(`<h${level} id="${id}">${inline(heading[2].trim())}</h${level}>`);
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
			html.push(renderTable(header, rows));
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '')) {
				items.push((lines[i] ?? '').replace(/^\s*[-*]\s+/, ''));
				i += 1;
			}
			html.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
			continue;
		}

		if (/^\s*\d+\.\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
				items.push((lines[i] ?? '').replace(/^\s*\d+\.\s+/, ''));
				i += 1;
			}
			html.push(`<ol>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>`);
			continue;
		}

		if (/^>\s?/.test(line)) {
			const block: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) {
				block.push((lines[i] ?? '').replace(/^>\s?/, ''));
				i += 1;
			}
			html.push(`<blockquote>${block.map((part) => `<p>${inline(part)}</p>`).join('')}</blockquote>`);
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
		html.push(`<p>${inline(text)}</p>`);
	}

	return {
		html: html.join('\n'),
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

function inline(value: string): string {
	let output = escapeHtml(value);

	output = output.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_match, target, label) => {
		const slug = normalizeArticleTarget(String(target));
		return `<a href="../${slug}/">${escapeHtml(String(label))}</a>`;
	});
	output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noreferrer" target="_blank">$1</a>');
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
