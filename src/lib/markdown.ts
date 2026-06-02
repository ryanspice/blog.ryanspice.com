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

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const LINK_EXCLUDED_TAGS = new Set(['a', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'math', 'pre', 'script', 'style', 'svg']);

type ProcessorResult = {
	html: string;
	toc: TocItem[];
	wordCount: number;
};

let processorPromise: Promise<(markdown: string) => Promise<ProcessorResult>> | null = null;

export async function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}): Promise<RenderedMarkdown> {
	const processor = await getMarkdownProcessor();
	const result = await processor(markdown);

	let renderedHtml = linkWikiLinks(result.html);
	if (options.linkTerms?.length) {
		renderedHtml = linkFirstOccurrences(renderedHtml, options.linkTerms);
	}
	renderedHtml = autoLinkUrls(renderedHtml);

	return {
		html: renderedHtml,
		toc: result.toc,
		wordCount: result.wordCount,
		readingMinutes: Math.max(1, Math.ceil(result.wordCount / 220))
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

async function getMarkdownProcessor(): Promise<(markdown: string) => Promise<ProcessorResult>> {
	if (!processorPromise) {
		processorPromise = createMarkdownProcessor();
	}
	return processorPromise;
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

function linkWikiLinks(html: string): string {
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

			let output = token;

			output = output.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_match, target, label) => {
				const slug = normalizeArticleTarget(String(target));
				return `<a class="wiki-link internal-link" href="../${escapeAttr(slug)}/">${escapeHtml(String(label))}</a>`;
			});

			output = output.replace(/\[\[([^\]]+)\]\]/g, (_match, target) => {
				const slug = normalizeArticleTarget(String(target));
				return `<a class="wiki-link internal-link" href="../${escapeAttr(slug)}/">${escapeHtml(String(target))}</a>`;
			});

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

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toClassList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap((entry) => (typeof entry === 'string' ? entry.split(/\s+/).filter(Boolean) : [])).filter(Boolean);
	}

	if (typeof value === 'string') {
		return value.split(/\s+/).filter(Boolean);
	}

	return [];
}

function hasClass(node: any, name: string): boolean {
	return toClassList(node?.properties?.className).includes(name);
}

function setClass(node: any, name: string) {
	const classes = new Set(toClassList(node?.properties?.className));
	classes.add(name);
	if (!node.properties) node.properties = {};
	node.properties.className = Array.from(classes);
}

function element(tagName: string, properties: Record<string, unknown> = {}, children: any[] = []): any {
	return { type: 'element', tagName, properties, children };
}

function text(value: string): any {
	return { type: 'text', value };
}

function hastText(node: any): string {
	if (!node) return '';
	if (node.type === 'text' && typeof node.value === 'string') return node.value;
	if (Array.isArray(node.children)) return node.children.map(hastText).join('');
	return '';
}

function leadSectionArt(): any {
	return element(
		'div',
		{ className: ['article-section-art'], 'aria-hidden': 'true' },
		[
			element(
				'svg',
				{ viewBox: '0 0 320 240', focusable: 'false', 'aria-hidden': 'true' },
				[
					element('defs', {}, [
						element('linearGradient', { id: 'lead-grid', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
							element('stop', { offset: '0%', 'stop-color': 'currentColor', 'stop-opacity': '0.12' }),
							element('stop', { offset: '100%', 'stop-color': 'currentColor', 'stop-opacity': '0.02' })
						])
					]),
					element('rect', { x: '22', y: '18', width: '276', height: '204', rx: '24', fill: 'url(#lead-grid)', opacity: '0.9' }),
					element(
						'g',
						{ fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
						[
							element('rect', { x: '176', y: '28', width: '92', height: '92', rx: '14', opacity: '0.26', 'stroke-width': '1.4' }),
							element('rect', { x: '124', y: '76', width: '106', height: '106', rx: '16', opacity: '0.45', 'stroke-width': '1.6' }),
							element('rect', { x: '64', y: '126', width: '124', height: '70', rx: '16', opacity: '0.78', 'stroke-width': '1.8' }),
							element('path', { d: 'M64 162H188', opacity: '0.34', 'stroke-width': '1.3' }),
							element('path', { d: 'M124 118H230', opacity: '0.28', 'stroke-width': '1.3' }),
							element('path', { d: 'M176 74H268', opacity: '0.22', 'stroke-width': '1.3' })
						]
					),
					element('g', { fill: 'currentColor', opacity: '0.22' }, [
						element('circle', { cx: '88', cy: '58', r: '2.2' }),
						element('circle', { cx: '105', cy: '39', r: '1.6' }),
						element('circle', { cx: '244', cy: '48', r: '1.8' }),
						element('circle', { cx: '214', cy: '184', r: '2.1' })
					])
				]
			)
		]
	);
}

function mdastText(node: any): string {
	if (!node) return '';
	if (node.type === 'text' && typeof node.value === 'string') return node.value;
	if (Array.isArray(node.children)) return node.children.map(mdastText).join('');
	return '';
}

async function createMarkdownProcessor(): Promise<(markdown: string) => Promise<ProcessorResult>> {
	const [{ unified }, remarkParseModule, remarkGfmModule, remarkRehypeModule, rehypeStringifyModule, visitModule] =
		await Promise.all([
			import('unified'),
			import('remark-parse'),
			import('remark-gfm'),
			import('remark-rehype'),
			import('rehype-stringify'),
			import('unist-util-visit')
		]);

	const remarkParse = (remarkParseModule as any).default ?? remarkParseModule;
	const remarkGfm = (remarkGfmModule as any).default ?? remarkGfmModule;
	const remarkRehype = (remarkRehypeModule as any).default ?? remarkRehypeModule;
	const rehypeStringify = (rehypeStringifyModule as any).default ?? rehypeStringifyModule;
	const visit = (visitModule as any).visit ?? (visitModule as any).default ?? visitModule;

	const rehypePrettyCode = import.meta.env.SSR ? ((await import('rehype-pretty-code')) as any).default : null;

	function remarkCallouts() {
		return (tree: any) => {
			visit(tree, 'blockquote', (node: any) => {
				const first = node.children?.[0];
				if (!first || first.type !== 'paragraph') return;

				const firstText = mdastText(first).trim();
				const match = firstText.match(/^\[\!([A-Za-z0-9_-]+)\]([+-])?(?:\s+(.*))?$/);
				if (!match) return;

				const kindRaw = match[1] ?? 'note';
				const fold = match[2] ?? '';
				const titleRaw = (match[3] ?? '').trim();

				const kind = kindRaw.toLowerCase();
				const title = titleRaw || kindRaw.toUpperCase();

				node.data ??= {};
				node.data.hName = fold ? 'details' : 'aside';
				node.data.hProperties = {
					className: ['callout', `callout-${kind}`],
					...(fold === '+' ? { open: true } : {})
				};

				const titleNode = {
					type: 'paragraph',
					data: {
						hName: fold ? 'summary' : 'div',
						hProperties: fold ? {} : { className: ['callout-title'] }
					},
					children: [{ type: 'text', value: title }]
				};

				node.children = [titleNode, ...(node.children?.slice(1) ?? [])];
			});
		};
	}

	function rehypeMermaid() {
		return (tree: any) => {
			visit(tree, 'element', (node: any, index: number, parent: any) => {
				if (!parent || typeof index !== 'number') return;
				if (node.tagName !== 'pre') return;

				const code = node.children?.[0];
				if (!code || code.type !== 'element' || code.tagName !== 'code') return;

				const classes = toClassList(code.properties?.className);
				const isMermaid = classes.some((cls) => cls.toLowerCase() === 'language-mermaid');
				if (!isMermaid) return;

				const value = hastText(code);
				parent.children[index] = element('div', { className: ['mermaid-diagram', 'code-block'], 'data-lang': 'mermaid' }, [text(value)]);
			});
		};
	}

	function rehypeLinkClasses() {
		return (tree: any) => {
			visit(tree, 'element', (node: any) => {
				if (node.tagName !== 'a') return;

				const href = typeof node.properties?.href === 'string' ? node.properties.href : '';
				if (!href) return;

				const external = /^https?:\/\//i.test(href);
				if (!node.properties) node.properties = {};

				node.properties.className = Array.from(
					new Set([
						...toClassList(node.properties.className),
						'wiki-link',
						external ? 'external-link' : 'internal-link'
					])
				);

				if (external) {
					if (!node.properties.rel) node.properties.rel = 'noreferrer';
					if (!node.properties.target) node.properties.target = '_blank';
				}
			});
		};
	}

	function rehypeBlockquotes() {
		return (tree: any) => {
			visit(tree, 'element', (node: any) => {
				if (node.tagName !== 'blockquote') return;
				setClass(node, 'article-callout');
			});
		};
	}

	function rehypeImages() {
		return (tree: any) => {
			visit(tree, 'element', (node: any, index: number, parent: any) => {
				if (node.tagName === 'img') {
					standardizeMarkdownImage(node);
					return;
				}

				if (node.tagName !== 'p') return;
				if (!parent || typeof index !== 'number') return;
				const children = Array.isArray(node.children) ? node.children.filter((child: any) => hastText(child).trim() || child.tagName === 'img') : [];
				if (children.length !== 1) return;
				const image = children[0];
				if (image?.type !== 'element' || image.tagName !== 'img') return;

				standardizeMarkdownImage(image);
				parent.children[index] = articleImageFigure(image);
			});
		};
	}

	function standardizeMarkdownImage(node: any) {
		node.properties ??= {};
		node.properties.loading ??= 'lazy';
		node.properties.decoding ??= 'async';
		node.properties.sizes ??= '(min-width: 1040px) 760px, calc(100vw - 32px)';
		const responsiveSrcset = markdownResponsiveSrcset(typeof node.properties.src === 'string' ? node.properties.src : '');
		if (responsiveSrcset) node.properties.srcSet ??= responsiveSrcset;
		setClass(node, 'article-image');
	}

	function markdownResponsiveSrcset(src: string): string | undefined {
		const match = src.match(/^(.*?)-(?:900|1200|1600)w\.(webp|jpe?g|png)$/i);
		if (!match) return undefined;
		const [, base, ext] = match;
		return [900, 1200, 1600].map((width) => `${base}-${width}w.${ext} ${width}w`).join(', ');
	}

	function articleImageFigure(node: any) {
		const caption = typeof node.properties?.title === 'string' ? node.properties.title.trim() : '';
		if (node.properties) delete node.properties.title;
		return element(
			'figure',
			{ className: ['article-figure', caption ? 'article-figure--captioned' : 'article-figure--plain'], 'data-image-preset': 'content' },
			[
				node,
				...(caption ? [element('figcaption', {}, [text(caption)])] : [])
			]
		);
	}

	function rehypeWrapTables() {
		return (tree: any) => {
			visit(tree, 'element', (node: any, index: number, parent: any) => {
				if (node.tagName !== 'table') return;
				if (!parent || typeof index !== 'number') return;
				if (parent.type === 'element' && parent.tagName === 'div' && hasClass(parent, 'table-wrap')) return;

				parent.children[index] = element('div', { className: ['table-wrap'] }, [node]);
			});
		};
	}

	function rehypeCodeMeta() {
		return (tree: any) => {
			visit(tree, 'element', (node: any) => {
				if (node.tagName !== 'pre') return;
				if (!node.children?.length) return;

				const code = node.children.find((child: any) => child?.type === 'element' && child.tagName === 'code');
				if (!code) return;

				const fromData = typeof node.properties?.['data-language'] === 'string' ? node.properties['data-language'] : '';
				const fromClass = toClassList(code.properties?.className)
					.map((cls) => cls.toLowerCase())
					.find((cls) => cls.startsWith('language-'))?.slice('language-'.length) ?? '';
				const lang = (fromData || fromClass || 'text').toLowerCase();

				node.properties ??= {};
				node.properties['data-lang'] = lang;
				setClass(node, 'code-block');
			});
		};
	}

	function rehypeHeadingsAndToc() {
		return (tree: any, file: any) => {
			const toc: TocItem[] = [];
			const usedIds: string[] = [];

			visit(tree, 'element', (node: any) => {
				if (!/^h[1-6]$/.test(node.tagName)) return;
				const level = Number(node.tagName.slice(1));
				if (![1, 2, 3].includes(level)) return;

				const plain = hastText(node).trim();
				if (!plain) return;

				const id = uniqueSlug(plain, usedIds);
				usedIds.push(id);
				node.properties ??= {};
				node.properties.id = id;

				if (level === 2 || level === 3) {
					toc.push({ id, text: plain, level: level as 2 | 3 });
				}
			});

			file.data ??= {};
			file.data.toc = toc;
		};
	}

	function rehypeGroupSections() {
		return (tree: any) => {
			if (!Array.isArray(tree.children)) return;

			const out: any[] = [];
			let sectionBlocks: any[] = [];
			let sectionActive = false;
			let sectionCount = 0;

			function flush() {
				if (!sectionActive || sectionBlocks.length === 0) return;

				const isLead = sectionCount === 0;
				out.push(
					element(
						'section',
						{ className: ['article-section', ...(isLead ? ['article-section--lead'] : [])] },
						[
							element('div', { className: ['article-section-body'] }, sectionBlocks),
							...(isLead ? [leadSectionArt()] : [])
						]
					)
				);

				sectionBlocks = [];
				sectionCount += 1;
			}

			for (const node of tree.children) {
				if (node?.type === 'element' && node.tagName === 'section' && hasClass(node, 'footnotes')) {
					flush();
					out.push(node);
					continue;
				}

				if (node?.type === 'element' && node.tagName === 'h2') {
					if (sectionActive) flush();
					sectionActive = true;
				}

				if (sectionActive) {
					sectionBlocks.push(node);
				} else {
					out.push(node);
				}
			}

			flush();
			tree.children = out;
		};
	}

	function rehypeMarkLede() {
		return (tree: any) => {
			const lead = Array.isArray(tree.children)
				? tree.children.find((node: any) => node?.type === 'element' && node.tagName === 'section' && hasClass(node, 'article-section--lead'))
				: null;
			if (!lead) return;

			const body = lead.children?.find((child: any) => child?.type === 'element' && child.tagName === 'div' && hasClass(child, 'article-section-body'));
			if (!body || !Array.isArray(body.children)) return;

			const firstParagraph = body.children.find((child: any) => child?.type === 'element' && child.tagName === 'p');
			if (!firstParagraph) return;
			setClass(firstParagraph, 'article-lede');
		};
	}

	function rehypeWordCount() {
		return (tree: any, file: any) => {
			let count = 0;

			function walk(node: any, stack: string[]) {
				if (!node) return;

				if (node.type === 'element' && typeof node.tagName === 'string') {
					const nextStack = [...stack, node.tagName.toLowerCase()];
					for (const child of node.children ?? []) {
						walk(child, nextStack);
					}
					return;
				}

				if (node.type === 'text' && typeof node.value === 'string') {
					if (stack.some((tag) => LINK_EXCLUDED_TAGS.has(tag))) return;
					const words = node.value.split(/\s+/).filter(Boolean).length;
					count += words;
				}
			}

			walk(tree, []);
			file.data ??= {};
			file.data.wordCount = count;
		};
	}

	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkCallouts)
		.use(remarkRehype, { allowDangerousHtml: false })
		.use(rehypeMermaid)
		.use(rehypeLinkClasses)
		.use(rehypeBlockquotes)
		.use(rehypeImages)
		.use(rehypeWrapTables)
		.use(import.meta.env.SSR && rehypePrettyCode ? rehypePrettyCode : () => {},
			import.meta.env.SSR && rehypePrettyCode
				? {
						theme: 'github-dark',
						keepBackground: false,
						defaultLang: 'text'
					}
				: undefined
		)
		.use(rehypeCodeMeta)
		.use(rehypeHeadingsAndToc)
		.use(rehypeGroupSections)
		.use(rehypeMarkLede)
		.use(rehypeWordCount)
		.use(rehypeStringify);

	return async (markdown: string) => {
		const file = await processor.process(markdown);
		const data = (file.data ?? {}) as any;
		return {
			html: String(file),
			toc: Array.isArray(data.toc) ? (data.toc as TocItem[]) : [],
			wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0
		};
	};
}
