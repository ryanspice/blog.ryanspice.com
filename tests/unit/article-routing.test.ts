import { describe, expect, it } from 'vitest';

import { pathWithLocale } from '../../src/lib/i18n/locales';

describe('locale routing helper', () => {
	it('keeps english routes unprefixed', () => {
		expect(pathWithLocale('en', '/')).toBe('/');
		expect(pathWithLocale('en', '/drafts/')).toBe('/drafts/');
		expect(pathWithLocale('en', '/dev-log/')).toBe('/dev-log/');
	});

	it('prefixes routed locales', () => {
		expect(pathWithLocale('fr', '/')).toBe('/fr/');
		expect(pathWithLocale('fr', '/drafts/')).toBe('/fr/drafts/');
		expect(pathWithLocale('fr', '/dev-log/')).toBe('/fr/dev-log/');
	});
});
