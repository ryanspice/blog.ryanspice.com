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
		title: 'Canopy Digital Blog · Technical notes',
		description: 'Technical notes, implementation writeups, and production research from Canopy Digital.',
		eyebrow: 'Canopy Digital · technical blog',
		heading: 'Practical notes on web platforms, AI tooling, local-first systems, and production delivery.',
		dek:
			'A lightweight publishing surface for Canopy Digital research and implementation notes, generated from the same source-of-truth content pipeline as Ryan\'s technical blog.',
		focusNote: 'Current focus: durable web systems, AI-assisted delivery, and deployment patterns that survive real constraints.',
		quickLinks: 'Canopy links',
		latestArticles: 'Latest articles',
		recentPosts: 'Recent published posts',
		recentPostsDek: 'The newest public technical notes, capped to the latest 5 posts.',
		elsewhere: 'Canopy Digital',
		linksInfo: 'Links and site info',
		footerDek:
			'A static SvelteKit publishing surface for technical notes, repair logs, and research writeups. The Canopy build keeps the same content source with a lighter client-facing skin.',
		staticSite: 'Static build'
	},
	rss: {
		title: 'RSS feed · Canopy Digital Blog',
		description: 'Human-friendly RSS feed page for the Canopy Digital Blog.',
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
		title: 'Canopy Digital Blog · Notes techniques',
		description: 'Notes techniques, comptes rendus de mise en oeuvre et recherche de production de Canopy Digital.',
		eyebrow: 'Canopy Digital · blogue technique',
		heading: 'Notes pratiques sur les plateformes web, les outils IA, les systemes local-first et la livraison production.',
		dek:
			'Une surface de publication legere pour la recherche et les notes de mise en oeuvre de Canopy Digital, generee depuis le meme pipeline de contenu source que le blogue technique de Ryan.',
		focusNote: 'Priorite actuelle: systemes web durables, livraison assistee par IA et deploiements qui tiennent sous contraintes reelles.',
		quickLinks: 'Liens Canopy',
		latestArticles: 'Articles recents',
		recentPosts: 'Publications recentes',
		recentPostsDek: 'Les plus recentes notes techniques publiques, limitees aux 5 dernieres publications.',
		elsewhere: 'Canopy Digital',
		linksInfo: 'Liens et information du site',
		footerDek:
			'Une surface SvelteKit statique pour notes techniques, journaux de reparation et recherches. La version Canopy garde la meme source de contenu avec une interface client plus legere.',
		staticSite: 'Build statique'
	},
	rss: {
		title: 'Flux RSS · Canopy Digital Blog',
		description: 'Page RSS lisible pour le Canopy Digital Blog.',
		channelTitle: 'Canopy Digital · Notes techniques',
		channelDescription: 'Notes techniques publiees et recherche de production de Canopy Digital.',
		heading: 'Abonnez-vous au flux des notes techniques de Canopy Digital.',
		readerDek: 'Cette page est la version lisible du flux Canopy. Le XML RSS brut se trouve a'
	}
};
