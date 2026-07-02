import { describe, expect, it } from 'vitest';
import {
	jsonLdScriptHtml,
	jsonLdScriptText,
	safeInlineHtml,
	sanitizeTrustedSvg
} from '../../src/lib/safe-html';

describe('safe HTML helpers', () => {
	it('escapes JSON-LD text for HTML script context', () => {
		const text = jsonLdScriptText({
			name: '</script><script>alert(1)</script>',
			description: 'line\u2028separator'
		});

		expect(text).not.toContain('<script>');
		expect(text).toContain('\\u003c/script>');
		expect(text).toContain('\\u2028');
		expect(text).not.toContain('</script><script>');
	});

	it('can wrap JSON-LD text when a complete script fragment is required', () => {
		const html = jsonLdScriptHtml({
			name: '</script><script>alert(1)</script>'
		});

		expect(html).toContain('<script type="application/ld+json">');
		expect(html).toContain('\\u003c/script>');
		expect(html).not.toContain('</script><script>');
	});

	it('allows only the tiny inline article rail tag set', () => {
		const html = safeInlineHtml('<strong onclick="alert(1)">Angle</strong> <script>alert(1)</script> <em>ok</em>');

		expect(html).toContain('&lt;strong onclick=&quot;alert(1)&quot;&gt;Angle</strong>');
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(html).toContain('<em>ok</em>');
	});

	it('removes active content from trusted SVG fragments', () => {
		const svg = sanitizeTrustedSvg(
			'<svg onload="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a><foreignObject><iframe></iframe></foreignObject></svg>'
		);

		expect(svg).toContain('<svg');
		expect(svg).not.toContain('onload');
		expect(svg).not.toContain('<script');
		expect(svg).not.toContain('javascript:');
		expect(svg).not.toContain('<foreignObject');
	});
});
