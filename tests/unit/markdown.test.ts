import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

describe('renderMarkdown', () => {
	it('does not pass raw Markdown HTML through to rendered article HTML', async () => {
		const rendered = await renderMarkdown('<script>alert(1)</script>\n\n<strong>raw strong</strong>');

		expect(rendered.html).not.toContain('<script>');
		expect(rendered.html).not.toContain('<strong>raw strong</strong>');
		expect(rendered.html).not.toContain('alert(1)');
		expect(rendered.html).toContain('raw strong');
	}, 20_000);

	it('prerenders mermaid diagrams to static SVG', async () => {
		const rendered = await renderMarkdown(`\`\`\`mermaid
flowchart TD
  A[React app] --> B[Render job API]
\`\`\``);

		expect(rendered.html).toContain('mermaid-diagram');
		expect(rendered.html).toContain('mermaid-ready');
		expect(rendered.html).toContain('<svg');
		expect(rendered.html).not.toContain('language-mermaid');
	}, 20_000);

	it('renders X post shorthand as safe linked blockquotes', async () => {
		const rendered = await renderMarkdown('::x-post[OpenAI/2104984504133918973] OpenAI introduces dots.');

		expect(rendered.html).toContain('class="twitter-tweet"');
		expect(rendered.html).toContain('OpenAI introduces dots.');
		expect(rendered.html).toContain('https://x.com/OpenAI/status/2104984504133918973');
		expect(rendered.html).not.toContain('::x-post');
	}, 20_000);
});
