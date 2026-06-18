import { getDictionary, type UiDictionary } from '$lib/i18n/dictionaries';
import { resolveLocale } from '$lib/i18n/locales';
import { resolveSiteId, siteConfigs, type SiteConfig } from '$lib/site-config';

type DictionaryOverrides = {
	nav?: Partial<UiDictionary['nav']>;
	home?: Partial<UiDictionary['home']>;
	rss?: Partial<UiDictionary['rss']>;
	article?: Partial<UiDictionary['article']>;
};

export function getSiteConfig(): SiteConfig {
	return siteConfigs[resolveSiteId(process.env.PUBLIC_SITE_ID ?? process.env.BLOG_SITE_ID)];
}

export function getSiteDictionary(localeValue: string | null | undefined, site: SiteConfig = getSiteConfig()): UiDictionary {
	const locale = resolveLocale(localeValue);
	const base = getDictionary(locale);

	if (site.id === 'ryan') return base;

	return mergeDictionary(base, locale === 'fr' ? canopyFrenchOverrides : canopyEnglishOverrides);
}

function mergeDictionary(base: UiDictionary, overrides: DictionaryOverrides): UiDictionary {
	return {
		nav: { ...base.nav, ...overrides.nav },
		home: { ...base.home, ...overrides.home },
		rss: { ...base.rss, ...overrides.rss },
		article: { ...base.article, ...overrides.article }
	};
}

const canopyEnglishOverrides: DictionaryOverrides = {
	nav: {
		githubRepo: 'Source repo'
	},
	home: {
		title: 'Practical web design and SEO notes · Canopy Digital Blog',
		description: 'Web design, local SEO, maintenance, and practical technology notes from Canopy Digital.',
		eyebrow: 'Canopy Digital · technical blog',
		heading: 'Practical web design, SEO, and technology notes for London businesses.',
		dek:
			'Field notes from the same practical delivery mindset behind Canopy Digital: clear websites, local visibility, care plans, and the technology choices that keep small-business web systems maintainable.',
		focusNote: 'Current focus: durable websites, local SEO, AI-assisted delivery, and launch patterns that survive real constraints.',
		quickLinks: 'Canopy links',
		assuranceHeading: 'Delivery signals',
		assuranceDek: 'A quick read on freshness, discoverability, and the public handoff surface.',
		assuranceFreshLabel: 'Latest field note',
		assuranceFreshValue: 'Updated from the newest public article',
		assuranceFeedLabel: 'Share-ready feed',
		assuranceFeedValue: 'RSS page, XML, and social previews',
		assuranceArchiveLabel: 'Indexed library',
		assuranceArchiveValue: 'Every public note remains linked',
		assuranceBuildLabel: 'Static handoff',
		assuranceBuildValue: 'Fast shared-hosting deployment',
		latestArticles: 'Latest articles',
		recentPosts: 'Recent published posts',
		recentPostsDek: 'Every public note on web infrastructure, delivery workflow, tooling, and small-business technology decisions.',
		elsewhere: 'Canopy Digital',
		linksInfo: 'Links and site info',
		footerDek:
			'A static SvelteKit publishing surface for technical notes and implementation writeups, skinned to match the Canopy Digital service site.',
		staticSite: 'Static build'
	},
	rss: {
		title: 'Subscribe to the Canopy Digital technical notes feed',
		description: 'Readable RSS subscription page for Canopy Digital web design, local SEO, maintenance, and technology notes.',
		channelTitle: 'Canopy Digital · Technical notes',
		channelDescription: 'Published technical notes and production research from Canopy Digital.',
		heading: 'Subscribe to the Canopy Digital technical notes feed.',
		readerDek: 'This page is the readable version of the Canopy feed. The raw RSS XML is at'
	}
};

const canopyFrenchOverrides: DictionaryOverrides = {
	nav: {
		githubRepo: 'Depot source'
	},
	home: {
		title: 'Notes pratiques sur le design web et le SEO · Canopy Digital Blog',
		description: 'Design web, SEO local, maintenance et notes techniques pratiques de Canopy Digital.',
		eyebrow: 'Canopy Digital · blogue technique',
		heading: 'Notes pratiques sur le design web, le SEO et la technologie pour les entreprises de London.',
		dek:
			'Notes de terrain issues de la meme approche pratique que Canopy Digital: sites clairs, visibilite locale, plans de maintenance et choix techniques maintenables.',
		focusNote: 'Priorite actuelle: sites web durables, SEO local, livraison assistee par IA et lancements qui tiennent sous contraintes reelles.',
		quickLinks: 'Liens Canopy',
		assuranceHeading: 'Signaux de livraison',
		assuranceDek: 'Lecture rapide de la fraicheur, de la decouvrabilite et de la surface publique.',
		assuranceFreshLabel: 'Derniere note terrain',
		assuranceFreshValue: 'Mise a jour depuis le plus recent article public',
		assuranceFeedLabel: 'Flux partageable',
		assuranceFeedValue: 'Page RSS, XML et apercus sociaux',
		assuranceArchiveLabel: 'Bibliotheque indexee',
		assuranceArchiveValue: 'Chaque note publique reste liee',
		assuranceBuildLabel: 'Handoff statique',
		assuranceBuildValue: 'Deploiement rapide sur hebergement partage',
		latestArticles: 'Articles recents',
		recentPosts: 'Publications recentes',
		recentPostsDek: 'Toutes les notes publiques sur infrastructure web, livraison, outils et decisions techniques pour petites entreprises.',
		elsewhere: 'Canopy Digital',
		linksInfo: 'Liens et information du site',
		footerDek:
			'Une surface SvelteKit statique pour notes techniques et comptes rendus, avec une interface alignee sur le site de services Canopy Digital.',
		staticSite: 'Build statique'
	},
	rss: {
		title: 'Abonnement au flux des notes techniques · Canopy Digital Blog',
		description: 'Page RSS lisible pour les notes de design web, SEO local, maintenance et technologie de Canopy Digital.',
		channelTitle: 'Canopy Digital · Notes techniques',
		channelDescription: 'Notes techniques publiees et recherche de production de Canopy Digital.',
		heading: 'Abonnez-vous au flux des notes techniques de Canopy Digital.',
		readerDek: 'Cette page est la version lisible du flux Canopy. Le XML RSS brut se trouve a'
	}
};
