import type { Article } from '$lib/articles';
import type { SiteConfig } from '$lib/site-config';

const EMPTY_ARTICLES: Article[] = [];
const EMPTY_TAGS: string[] = [];

export function normalizeArticles(value: unknown): Article[] {
	return Array.isArray(value) ? (value as Article[]) : EMPTY_ARTICLES;
}

export function normalizeTags(value: unknown): string[] {
	return Array.isArray(value) ? (value as string[]) : EMPTY_TAGS;
}

export function firstArticles(articles: Article[]): Article[] {
	return articles.slice(0, 5);
}

export function externalHeaderLinks(siteConfig: SiteConfig): SiteConfig['footerExternalLinks'] {
	return siteConfig.mainSiteLink ? [siteConfig.mainSiteLink, siteConfig.primaryExternalLink] : [siteConfig.primaryExternalLink];
}

export function cssImageUrl(src: string | undefined): string | undefined {
	return src ? `url("${src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")` : undefined;
}

export function buildAssuranceCards(
	homeCopy: {
		assuranceFreshLabel: string;
		assuranceFreshValue: string;
		assuranceFeedLabel: string;
		rssFeed: string;
		assuranceFeedValue: string;
		assuranceArchiveLabel: string;
		posts: string;
		assuranceArchiveValue: string;
		assuranceBuildLabel: string;
		staticSite: string;
		assuranceBuildValue: string;
	},
	freshValue: string,
	freshHref: string,
	rssReaderPath: string,
	articleCount: number
) {
	return [
		{
			label: homeCopy.assuranceFreshLabel,
			value: freshValue,
			text: homeCopy.assuranceFreshValue,
			href: freshHref
		},
		{
			label: homeCopy.assuranceFeedLabel,
			value: homeCopy.rssFeed,
			text: homeCopy.assuranceFeedValue,
			href: rssReaderPath
		},
		{
			label: homeCopy.assuranceArchiveLabel,
			value: `${articleCount} ${homeCopy.posts}`,
			text: homeCopy.assuranceArchiveValue,
			href: '#articles'
		},
		{
			label: homeCopy.assuranceBuildLabel,
			value: homeCopy.staticSite,
			text: homeCopy.assuranceBuildValue
		}
	];
}

export function buildHomeJsonLd(siteId: string, locale: string): Record<string, unknown> {
	if (siteId === 'canopy') {
		return {
			'@context': 'https://schema.org',
			'@type': 'Blog',
			name: 'Canopy Digital Blog',
			url: locale === 'fr' ? 'https://blog.canopydigital.ca/fr/' : 'https://blog.canopydigital.ca/',
			description:
				locale === 'fr'
					? 'Design web, SEO local, maintenance et notes techniques pratiques de Canopy Digital.'
					: 'Web design, local SEO, maintenance, and practical technology notes from Canopy Digital.',
			publisher: {
				'@type': 'Organization',
				name: 'Canopy Digital',
				url: 'https://canopydigital.ca'
			}
		};
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'blog.ryanspice.com',
		url: locale === 'fr' ? 'https://blog.ryanspice.com/fr/' : 'https://blog.ryanspice.com/',
		description:
			locale === 'fr'
				? 'Articles techniques, notes de production et journal de developpement leger de Ryan Spice.'
				: 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.',
		author: {
			'@type': 'Person',
			name: 'Ryan Spice',
			url: 'https://ryanspice.com'
		},
		publisher: {
			'@type': 'Organization',
			name: 'Canopy Digital',
			url: 'https://canopydigital.ca'
		}
	};
}
