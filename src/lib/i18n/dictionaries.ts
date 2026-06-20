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
		assuranceHeading: string;
		assuranceDek: string;
		assuranceFreshLabel: string;
		assuranceFreshValue: string;
		assuranceFeedLabel: string;
		assuranceFeedValue: string;
		assuranceArchiveLabel: string;
		assuranceArchiveValue: string;
		assuranceBuildLabel: string;
		assuranceBuildValue: string;
		latestArticles: string;
		recentPosts: string;
		recentPostsDek: string;
		articleSearch: string;
		articleSearchPlaceholder: string;
		articleTagFilter: string;
		allTags: string;
		search: string;
		resetFilters: string;
		matchingArticles: string;
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
		furtherReading: string;
		furtherReadingHeading: string;
		furtherReadingDek: string;
		related: string;
		relatedHeading: string;
		relatedDek: string;
		back: string;
		rss: string;
		copyLink: string;
		linkCopied: string;
		copyFailed: string;
		articleActions: string;
		openArticle: string;
		shareArticle: string;
		shareOpened: string;
		shareFacebook: string;
		moreShareActions: string;
		shareX: string;
		shareLinkedIn: string;
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
			title: 'Practical technical notes · blog.ryanspice.com',
			description: 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.',
			eyebrow: 'Ryan Spice · technical blog',
			heading: 'Practical field notes for tooling, web work, AI research, and weird Windows problems.',
			dek:
				'A SvelteKit-first blog project staged inside the AI Wiki, with repair logs, debugging notes, research comparisons, and a lightweight dev log that stays grounded in the actual workflow.',
			startLatest: 'Start with the latest article',
			browseLatest: 'Browse all articles',
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
			assuranceHeading: 'What is current here',
			assuranceDek: 'A compact map of the public archive, feed, and build surface.',
			assuranceFreshLabel: 'Freshest note',
			assuranceFreshValue: 'Updated from the latest published article',
			assuranceFeedLabel: 'Feed-ready',
			assuranceFeedValue: 'Readable RSS page plus raw XML',
			assuranceArchiveLabel: 'Public archive',
			assuranceArchiveValue: 'All published notes stay indexed',
			assuranceBuildLabel: 'Static build',
			assuranceBuildValue: 'SvelteKit output for shared hosting',
			latestArticles: 'Latest articles',
			recentPosts: 'Recent published posts',
			recentPostsDek: 'All currently published public technical notes, newest first.',
			articleSearch: 'Search articles',
			articleSearchPlaceholder: 'Title, summary, tag...',
			articleTagFilter: 'Filter by tag',
			allTags: 'All tags',
			search: 'Search',
			resetFilters: 'Reset',
			matchingArticles: 'matching articles',
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
			title: 'Subscribe to the technical notes feed · blog.ryanspice.com',
			description: 'Readable RSS subscription page for Ryan Spice technical notes, recent articles, and public production writeups.',
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
			sourcesHeading: 'Sources',
			sourcesDek: 'Primary documentation and source material used for the factual claims in this article.',
			furtherReading: 'Further reading',
			furtherReadingHeading: 'Further reading',
			furtherReadingDek: 'Related notes and background material worth opening next.',
			related: 'Related articles',
			relatedHeading: 'More like this',
			relatedDek: 'Articles with overlapping tags, explicit references, or the same line of work.',
			back: 'Back',
			rss: 'RSS',
			copyLink: 'Copy link',
			linkCopied: 'Link copied',
			copyFailed: 'Copy failed',
			articleActions: 'Article actions',
			openArticle: 'Open',
			shareArticle: 'Share',
			shareOpened: 'Share opened',
			shareFacebook: 'Facebook',
			moreShareActions: 'More',
			shareX: 'X',
			shareLinkedIn: 'LinkedIn',
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
			title: 'Notes techniques pratiques · blog.ryanspice.com',
			description: 'Articles techniques, notes de production et journal de developpement leger de Ryan Spice.',
			eyebrow: 'Ryan Spice · blogue technique',
			heading: 'Notes pratiques sur les outils, le web, la recherche IA et les problemes Windows etranges.',
			dek:
				'Un blogue SvelteKit prepare dans AI Wiki, avec journaux de reparation, notes de debogage, comparaisons de recherche et un journal de developpement ancre dans le vrai flux de travail.',
			startLatest: 'Lire le plus recent article',
			browseLatest: 'Voir tous les articles',
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
			assuranceHeading: 'Ce qui est actuel ici',
			assuranceDek: 'Carte compacte des archives publiques, du flux et de la surface de build.',
			assuranceFreshLabel: 'Note la plus recente',
			assuranceFreshValue: 'Mise a jour depuis le dernier article publie',
			assuranceFeedLabel: 'Pret pour le flux',
			assuranceFeedValue: 'Page RSS lisible et XML brut',
			assuranceArchiveLabel: 'Archive publique',
			assuranceArchiveValue: 'Toutes les notes publiees restent indexees',
			assuranceBuildLabel: 'Build statique',
			assuranceBuildValue: 'Sortie SvelteKit pour hebergement partage',
			latestArticles: 'Articles recents',
			recentPosts: 'Publications recentes',
			recentPostsDek: 'Toutes les notes techniques publiques actuellement publiees, de la plus recente a la plus ancienne.',
			articleSearch: 'Recherche d articles',
			articleSearchPlaceholder: 'Titre, resume, etiquette...',
			articleTagFilter: 'Filtrer par etiquette',
			allTags: 'Toutes les etiquettes',
			search: 'Rechercher',
			resetFilters: 'Reinitialiser',
			matchingArticles: 'articles correspondants',
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
			title: 'Abonnement au flux des notes techniques · blog.ryanspice.com',
			description: 'Page RSS lisible pour les notes techniques, articles recents et comptes rendus publics de Ryan Spice.',
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
			sourcesHeading: 'Sources',
			sourcesDek: 'Documentation primaire et materiel source utilises pour les affirmations factuelles de cet article.',
			furtherReading: 'Lectures connexes',
			furtherReadingHeading: 'Lectures connexes',
			furtherReadingDek: 'Notes reliees et contexte utile a ouvrir ensuite.',
			related: 'Articles connexes',
			relatedHeading: 'Dans le meme esprit',
			relatedDek: 'Articles avec des etiquettes, references explicites ou travaux similaires.',
			back: 'Retour',
			rss: 'RSS',
			copyLink: 'Copier le lien',
			linkCopied: 'Lien copie',
			copyFailed: 'Echec de copie',
			articleActions: 'Actions de l article',
			openArticle: 'Ouvrir',
			shareArticle: 'Partager',
			shareOpened: 'Partage ouvert',
			shareFacebook: 'Facebook',
			moreShareActions: 'Plus',
			shareX: 'X',
			shareLinkedIn: 'LinkedIn',
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
