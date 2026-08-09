import { describe, expect, it } from 'vitest';
import { getDictionary } from '../../src/lib/i18n/dictionaries';
import { getSiteDictionary } from '../../src/lib/server/site';
import { siteConfigs } from '../../src/lib/site-config';
import { firstArticles } from '../../src/lib/home-page-model';

const implementationTerms = /sveltekit|static (build|site|handoff)|github|microsoft sign-in|local markdown|publishing tool|ai wiki|build surface/i;

function publicHomeText(locale: 'en' | 'fr', site: 'ryan' | 'canopy') {
	const dictionary = site === 'ryan' ? getDictionary(locale) : getSiteDictionary(locale, siteConfigs.canopy);

	return Object.values(dictionary.home).filter((value): value is string => typeof value === 'string').join(' ');
}

describe('public homepage copy', () => {
	it('selects six newest articles for the default homepage', () => {
		const articles = Array.from({ length: 7 }, (_, index) => ({ slug: String(index) }));
		expect(firstArticles(articles as never[])).toHaveLength(6);
	});

	it.each([
		['en', 'ryan'],
		['fr', 'ryan'],
		['en', 'canopy'],
		['fr', 'canopy']
	] as const)('does not expose implementation language for %s/%s', (locale, site) => {
		expect(publicHomeText(locale, site)).not.toMatch(implementationTerms);
	});
});
