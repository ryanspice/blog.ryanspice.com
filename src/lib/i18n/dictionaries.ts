import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from './locales';

export type UiDictionary = {
	nav: {
		articles: string;
		rss: string;
		rssXml: string;
		devLog: string;
		library: string;
		briefs: string;
		drafts: string;
		githubRepo: string;
		sitemap: string;
		readingMode: string;
		readingOn: string;
	};
	home: {
		title: string;
		description: string;
		eyebrow: string;
		heading: string;
		dek: string;
		startLatest: string;
		browseLatest: string;
		publishedNotes: string;
		latestUpdate: string;
		subscribe: string;
		rssFeed: string;
		latestArticle: string;
		latestArticleFallback: string;
		recentNotesFallback: string;
		published: string;
		readTime: string;
		type: string;
		focusNote: string;
		quickLinks: string;
		latestArticles: string;
		recentPosts: string;
		recentPostsDek: string;
		noArticles: string;
		noArticlesHeading: string;
		noArticlesDek: string;
		elsewhere: string;
		linksInfo: string;
		footerDek: string;
		posts: string;
		staticSite: string;
	};
	rss: {
		title: string;
		description: string;
		channelTitle: string;
		channelDescription: string;
		feedLabel: string;
		heading: string;
		readerDek: string;
		openXml: string;
		copyUrl: string;
		copied: string;
		copyFailed: string;
		backToArticles: string;
		openFriendlyPage: string;
		latestItems: string;
		recentEntries: string;
		recentEntriesDek: string;
	};
	article: {
		published: string;
		updated: string;
		articleInfo: string;
		readTime: string;
		type: string;
		release: string;
		tags: string;
		sources: string;
		sourcesHeading: string;
		sourcesDek: string;
		related: string;
		relatedHeading: string;
		relatedDek: string;
		back: string;
		rss: string;
		copyLink: string;
		linkCopied: string;
		copyFailed: string;
		minRead: string;
		home: string;
		githubRepo: string;
		devLog: string;
	};
};

const dictionaries: Record<SupportedLocale, UiDictionary> = {
	en: {
		nav: {
			articles: 'Articles',
			rss: 'RSS',
			rssXml: 'RSS XML',
			devLog: 'Dev log',
			library: 'Library',
			briefs: 'Briefs',
			drafts: 'Drafts',
			githubRepo: 'GitHub repo',
			sitemap: 'Sitemap',
			readingMode: 'Reading mode',
			readingOn: 'Reading on'
		},
		home: {
			title: 'blog.ryanspice.com · Technical notes',
			description: 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.',
			eyebrow: 'Ryan Spice · technical blog',
			heading: 'Practical field notes for tooling, web work, AI research, and weird Windows problems.',
			dek:
				'A SvelteKit-first blog project staged inside the AI Wiki, with repair logs, debugging notes, research comparisons, and a lightweight dev log that stays grounded in the actual workflow.',
			startLatest: 'Start with the latest article',
			browseLatest: 'Browse the latest 5',
			publishedNotes: 'Published notes',
			latestUpdate: 'Latest update',
			subscribe: 'Subscribe',
			rssFeed: 'RSS feed',
			latestArticle: 'Latest article',
			latestArticleFallback: 'Latest article',
			recentNotesFallback: 'Recent technical notes and comparisons.',
			published: 'Published',
			readTime: 'Read time',
			type: 'Type',
			focusNote:
				'Current focus: source-aware repair logs, practical web work, and research notes that are still readable later.',
			quickLinks: 'Quick links',
			latestArticles: 'Latest articles',
			recentPosts: 'Recent published posts',
			recentPostsDek: 'The newest published technical notes, capped to the latest 5 posts.',
			noArticles: 'No articles',
			noArticlesHeading: 'No published articles are available yet.',
			noArticlesDek: 'Check back after the next production deploy.',
			elsewhere: 'Elsewhere',
			linksInfo: 'Links and site info',
			footerDek:
				'A static SvelteKit blog for technical notes, repair logs, research writeups, and a lightweight dev log for site changes. The public surface stays small and easy to scan.',
			posts: 'posts',
			staticSite: 'Static site'
		},
		rss: {
			title: 'RSS feed · blog.ryanspice.com',
			description: 'Human-friendly RSS feed page for blog.ryanspice.com.',
			channelTitle: 'Ryan Spice · Technical notes',
			channelDescription: 'Published technical notes and production notes from Ryan Spice.',
			feedLabel: 'RSS feed',
			heading: 'Subscribe to the technical notes feed.',
			readerDek: 'This page is the readable version of the feed. The raw RSS XML is at',
			openXml: 'Open RSS XML',
			copyUrl: 'Copy feed URL',
			copied: 'Copied',
			copyFailed: 'Copy failed',
			backToArticles: 'Back to articles',
			openFriendlyPage: 'Open friendly feed page',
			latestItems: 'Latest items',
			recentEntries: 'Recent feed entries',
			recentEntriesDek: 'The feed includes the latest published public articles.'
		},
		article: {
			published: 'Published',
			updated: 'Updated',
			articleInfo: 'Article info',
			readTime: 'Read time',
			type: 'Type',
			release: 'Release',
			tags: 'Tags',
			sources: 'Sources',
			sourcesHeading: 'Sources and further reading',
			sourcesDek: 'External documentation and source material linked for the parts of the article that need it.',
			related: 'Related articles',
			relatedHeading: 'More like this',
			relatedDek: 'Articles with overlapping tags, explicit references, or the same line of work.',
			back: 'Back',
			rss: 'RSS',
			copyLink: 'Copy link',
			linkCopied: 'Link copied',
			copyFailed: 'Copy failed',
			minRead: 'min read',
			home: 'Home',
			githubRepo: 'GitHub repo',
			devLog: 'Dev log'
		}
	},
	fr: {
		nav: {
			articles: 'Articles',
			rss: 'RSS',
			rssXml: 'RSS XML',
			devLog: 'Journal dev',
			library: 'Bibliotheque',
			briefs: 'Briefs',
			drafts: 'Brouillons',
			githubRepo: 'Depot GitHub',
			sitemap: 'Plan du site',
			readingMode: 'Mode lecture',
			readingOn: 'Lecture active'
		},
		home: {
			title: 'blog.ryanspice.com · Notes techniques',
			description: 'Articles techniques, notes de production et journal de developpement leger de Ryan Spice.',
			eyebrow: 'Ryan Spice · blogue technique',
			heading: 'Notes pratiques sur les outils, le web, la recherche IA et les problemes Windows etranges.',
			dek:
				'Un blogue SvelteKit prepare dans AI Wiki, avec journaux de reparation, notes de debogage, comparaisons de recherche et un journal de developpement ancre dans le vrai flux de travail.',
			startLatest: 'Lire le plus recent article',
			browseLatest: 'Voir les 5 plus recents',
			publishedNotes: 'Notes publiees',
			latestUpdate: 'Derniere mise a jour',
			subscribe: 'Abonnement',
			rssFeed: 'Flux RSS',
			latestArticle: 'Article le plus recent',
			latestArticleFallback: 'Article le plus recent',
			recentNotesFallback: 'Notes techniques et comparaisons recentes.',
			published: 'Publie',
			readTime: 'Temps de lecture',
			type: 'Type',
			focusNote:
				'Priorite actuelle: journaux de reparation avec sources, travail web pratique et notes de recherche qui restent lisibles plus tard.',
			quickLinks: 'Liens rapides',
			latestArticles: 'Articles recents',
			recentPosts: 'Publications recentes',
			recentPostsDek: 'Les plus recentes notes techniques publiees, limitees aux 5 dernieres publications.',
			noArticles: 'Aucun article',
			noArticlesHeading: 'Aucun article publie n est disponible pour le moment.',
			noArticlesDek: 'Revenez apres le prochain deploiement de production.',
			elsewhere: 'Ailleurs',
			linksInfo: 'Liens et information du site',
			footerDek:
				'Un blogue SvelteKit statique pour notes techniques, journaux de reparation, recherches et changements de site. La surface publique reste petite et facile a parcourir.',
			posts: 'articles',
			staticSite: 'Site statique'
		},
		rss: {
			title: 'Flux RSS · blog.ryanspice.com',
			description: 'Page RSS lisible pour blog.ryanspice.com.',
			channelTitle: 'Ryan Spice · Notes techniques',
			channelDescription: 'Notes techniques publiees et notes de production de Ryan Spice.',
			feedLabel: 'Flux RSS',
			heading: 'Abonnez-vous au flux des notes techniques.',
			readerDek: 'Cette page est la version lisible du flux. Le XML RSS brut se trouve a',
			openXml: 'Ouvrir le XML RSS',
			copyUrl: 'Copier l URL du flux',
			copied: 'Copie',
			copyFailed: 'Echec de copie',
			backToArticles: 'Retour aux articles',
			openFriendlyPage: 'Ouvrir la page lisible du flux',
			latestItems: 'Derniers elements',
			recentEntries: 'Entrees recentes du flux',
			recentEntriesDek: 'Le flux contient les derniers articles publics publies.'
		},
		article: {
			published: 'Publie',
			updated: 'Mis a jour',
			articleInfo: 'Info article',
			readTime: 'Temps de lecture',
			type: 'Type',
			release: 'Publication',
			tags: 'Etiquettes',
			sources: 'Sources',
			sourcesHeading: 'Sources et lectures connexes',
			sourcesDek: 'Documentation externe et materiel source relies aux parties de l article qui en ont besoin.',
			related: 'Articles connexes',
			relatedHeading: 'Dans le meme esprit',
			relatedDek: 'Articles avec des etiquettes, references explicites ou travaux similaires.',
			back: 'Retour',
			rss: 'RSS',
			copyLink: 'Copier le lien',
			linkCopied: 'Lien copie',
			copyFailed: 'Echec de copie',
			minRead: 'min de lecture',
			home: 'Accueil',
			githubRepo: 'Depot GitHub',
			devLog: 'Journal dev'
		}
	}
};

export function getDictionary(locale: string | null | undefined): UiDictionary {
	return dictionaries[resolveLocale(locale)] ?? dictionaries[DEFAULT_LOCALE];
}
