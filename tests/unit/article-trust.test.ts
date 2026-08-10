import { describe, expect, it } from 'vitest';
import { hasArticleTrustNotes, optionalArticleDate } from '../../src/lib/article-trust';

describe('article trust metadata', () => {
	it('accepts a truthful optional ISO date', () => {
		expect(optionalArticleDate('2026-08-09', 'last_reviewed_date')).toBe('2026-08-09');
	});

	it('omits absent optional metadata', () => {
		expect(optionalArticleDate(undefined, 'last_reviewed_date')).toBeUndefined();
		expect(hasArticleTrustNotes({})).toBe(false);
	});

	it('rejects invalid optional dates', () => {
		expect(() => optionalArticleDate('2026-02-30', 'last_reviewed_date')).toThrow(/Invalid last_reviewed_date/);
	});

	it('renders trust notes only when a supported field is present', () => {
		expect(hasArticleTrustNotes({ disclosure: 'AI-assisted drafting disclosed.' })).toBe(true);
		expect(hasArticleTrustNotes({ correctionNote: 'Corrected a source link.' })).toBe(true);
	});
});
