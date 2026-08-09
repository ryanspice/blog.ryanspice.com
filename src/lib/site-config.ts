export type SiteId = 'ryan' | 'canopy';

type SiteLink = {
	label: string;
	href: string;
};

export type MonetizationMode = 'none' | 'house' | 'display' | 'affiliate';
export type MonetizationSlot = {
	mode: MonetizationMode;
	position: 'after-intro' | 'mid-article' | 'article-end';
	label: 'Advertisement' | 'Sponsored' | 'House note';
	title: string;
	body: string;
	link: SiteLink;
};

type SitePersonOrOrganization = {
	type: 'Person' | 'Organization';
	name: string;
	url: string;
};

type SiteUtilityRoute = {
	path: string;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority: number;
};

export type SiteConfig = {
	id: SiteId;
	themeClass: SiteId;
	brandLabel: string;
	brandInitials: string;
	siteName: string;
	domain: string;
	titleSuffix: string;
	description: string;
	generator: string;
	defaultOgImage: string;
	rssTitle: string;
	author: SitePersonOrOrganization;
	publisher?: SitePersonOrOrganization;
	mainSiteLink?: SiteLink;
	primaryExternalLink: SiteLink;
	footerExternalLinks: SiteLink[];
	repositoryLink?: SiteLink;
	showOwnerControls: boolean;
	showDevLogLinks: boolean;
	showLibraryLinks: boolean;
	indexedUtilityRoutes: SiteUtilityRoute[];
	robotsDisallow: string[];
	canonicalRedirectHosts: string[];
	publicRouteExclusions: string[];
	monetization: MonetizationSlot;
};

const DEFAULT_SITE_ID: SiteId = 'ryan';

export const siteConfigs: Record<SiteId, SiteConfig> = {
	ryan: {
		id: 'ryan',
		themeClass: 'ryan',
		brandLabel: 'Ryan Spice / Canopy Digital',
		brandInitials: 'RS',
		siteName: 'blog.ryanspice.com',
		domain: 'blog.ryanspice.com',
		titleSuffix: 'blog.ryanspice.com',
		description: 'Technical blog posts, production notes, and a lightweight dev log from Ryan Spice.',
		generator: 'blog.ryanspice.com',
		defaultOgImage: '/img/social/ryan/home.png',
		rssTitle: 'Ryan Spice Blog RSS',
		author: {
			type: 'Person',
			name: 'Ryan Spice',
			url: 'https://ryanspice.com'
		},
		publisher: {
			type: 'Organization',
			name: 'Canopy Digital',
			url: 'https://canopydigital.ca'
		},
		primaryExternalLink: {
			label: 'ryanspice.com',
			href: 'https://ryanspice.com'
		},
		footerExternalLinks: [
			{ label: 'ryanspice.com', href: 'https://ryanspice.com' },
			{ label: 'Canopy Digital', href: 'https://canopydigital.ca' }
		],
		repositoryLink: {
			label: 'GitHub repo',
			href: 'https://github.com/ryanspice/blog.ryanspice.com'
		},
		showOwnerControls: true,
		showDevLogLinks: true,
		showLibraryLinks: true,
		indexedUtilityRoutes: [
			{ path: '/library/', changefreq: 'monthly', priority: 0.6 },
			{ path: '/dev-log/', changefreq: 'weekly', priority: 0.6 }
		],
		robotsDisallow: ['/_incoming/', '/_releases/', '/_backups/'],
		canonicalRedirectHosts: ['^(www\\.)?ryanspice\\.com$'],
		publicRouteExclusions: [],
		monetization: {
			mode: 'none',
			position: 'article-end',
			label: 'House note',
			title: '',
			body: '',
			link: { label: '', href: '' }
		}
	},
	canopy: {
		id: 'canopy',
		themeClass: 'canopy',
		brandLabel: 'Canopy Digital',
		brandInitials: 'CD',
		siteName: 'Canopy Digital Blog',
		domain: 'blog.canopydigital.ca',
		titleSuffix: 'Canopy Digital Blog',
		description: 'Web design, local SEO, maintenance, and practical technology notes from Canopy Digital.',
		generator: 'blog.canopydigital.ca',
		defaultOgImage: '/img/social/canopy/home.png',
		rssTitle: 'Canopy Digital Blog RSS',
		author: {
			type: 'Person',
			name: 'Ryan Spice',
			url: 'https://ryanspice.com'
		},
		publisher: {
			type: 'Organization',
			name: 'Canopy Digital',
			url: 'https://canopydigital.ca'
		},
		mainSiteLink: {
			label: 'Main site',
			href: 'https://canopydigital.ca'
		},
		primaryExternalLink: {
			label: 'Book a Consult',
			href: 'https://canopydigital.ca/#contact'
		},
		footerExternalLinks: [
			{ label: 'Main site', href: 'https://canopydigital.ca' },
			{ label: 'Services', href: 'https://canopydigital.ca/#services' },
			{ label: 'Pricing', href: 'https://canopydigital.ca/#pricing' },
			{ label: 'About', href: 'https://canopydigital.ca/#about' },
			{ label: 'Book a Consult', href: 'https://canopydigital.ca/#contact' }
		],
		showOwnerControls: false,
		showDevLogLinks: false,
		showLibraryLinks: true,
		indexedUtilityRoutes: [{ path: '/library/', changefreq: 'monthly', priority: 0.6 }],
		robotsDisallow: [
			'/_incoming/',
			'/_releases/',
			'/_backups/',
			'/auth/',
			'/briefs/',
			'/dev-log/',
			'/drafts/',
			'/login/',
			'/status/'
		],
		canonicalRedirectHosts: [],
		publicRouteExclusions: ['auth', 'briefs', 'dev-log', 'drafts', 'login', 'status'],
		monetization: {
			mode: 'house',
			position: 'article-end',
			label: 'House note',
			title: 'Need a clearer next step for your website?',
			body: 'Canopy Digital helps small businesses improve websites, local visibility, accessibility, and ongoing maintenance.',
			link: { label: 'Book a consult', href: 'https://canopydigital.ca/#contact' }
		}
	}
};

export function resolveSiteId(value: string | null | undefined): SiteId {
	const normalized = value?.trim().toLowerCase();
	if (normalized === 'canopy' || normalized === 'canopydigital' || normalized === 'blog.canopydigital.ca') {
		return 'canopy';
	}
	return DEFAULT_SITE_ID;
}
