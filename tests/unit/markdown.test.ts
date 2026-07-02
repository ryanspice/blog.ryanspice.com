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
});
