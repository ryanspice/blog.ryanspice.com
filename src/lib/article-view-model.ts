import { ARTICLE_SHARE_IMAGE_HEIGHT, ARTICLE_SHARE_IMAGE_WIDTH } from '$lib/article-social-images';
import type { Article } from '$lib/articles';
import type { SiteConfig } from '$lib/site-config';

export type ResourceLink = {
	label: string;
	href: string;
	external: boolean;
};

export const EMPTY_CO_AUTHORS: NonNullable<Article['coAuthors']> = [];

export function parseResourceLinks(values: string[]): ResourceLink[] {
	return values.map(parseResourceLink).filter((link): link is ResourceLink => Boolean(link));
}

export function buildArticleSchemaAuthors(siteConfig: SiteConfig, authors: NonNullable<Article['coAuthors']>): Array<Record<string, string>> {
	return [
		{
			'@type': siteConfig.author.type,
			name: siteConfig.author.name,
			url: siteConfig.author.url
		},
		...authors.map((coAuthor) => ({
			'@type': coAuthor.type ?? 'Person',
			name: coAuthor.name,
			...(coAuthor.href ? { url: coAuthor.href } : {})
		}))
	];
}

export function buildArticleHeaderLinks(navLinks: Article['design']['navLinks'], siteConfig: SiteConfig): Article['design']['navLinks'] {
	if (siteConfig.id !== 'canopy') return navLinks;
	return [...navLinks, ...(siteConfig.mainSiteLink ? [siteConfig.mainSiteLink] : []), siteConfig.primaryExternalLink];
}

export function buildArticleFooterLinks(
	copy: { home: string; rss: string; devLog: string },
	homeHref: string,
	rssHref: string,
	devLogHref: string,
	siteConfig: SiteConfig,
	includeRepository = true
): Article['design']['navLinks'] {
	const links = [
		{ label: copy.home, href: homeHref },
		{ label: copy.rss, href: rssHref }
	];
	if (includeRepository && siteConfig.repositoryLink) {
		links.push({ label: siteConfig.repositoryLink.label, href: siteConfig.repositoryLink.href });
	}
	if (siteConfig.showDevLogLinks) links.push({ label: copy.devLog, href: devLogHref });
	return links;
}

export function buildArticleJsonLd(
	currentArticle: Article,
	siteConfig: SiteConfig,
	homeLabel: string,
	homeHref: string,
	canonicalHref: string,
	pageDescription: string,
	authors: Array<Record<string, string>>,
	imageUrl: string,
	imageAlt: string,
	origin: string
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: homeLabel,
						item: new URL(homeHref, origin).toString()
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: currentArticle.title,
						item: canonicalHref
					}
				]
			},
			{
				'@type': 'BlogPosting',
				headline: currentArticle.title,
				description: pageDescription,
				mainEntityOfPage: canonicalHref,
				datePublished: currentArticle.date,
				dateModified: currentArticle.updatedDate,
				author: authors,
				publisher: siteConfig.publisher
					? {
							'@type': siteConfig.publisher.type,
							name: siteConfig.publisher.name,
							url: siteConfig.publisher.url
						}
					: undefined,
				image: {
					'@type': 'ImageObject',
					url: imageUrl,
					width: ARTICLE_SHARE_IMAGE_WIDTH,
					height: ARTICLE_SHARE_IMAGE_HEIGHT,
					caption: imageAlt
				},
				keywords: currentArticle.tags.join(', '),
				wordCount: currentArticle.wordCount,
				timeRequired: `PT${currentArticle.readingMinutes}M`
			}
		]
	};
}

export function cssImageUrl(value: string | undefined): string | undefined {
	return value ? `url("${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")` : undefined;
}

function parseResourceLink(value: string): ResourceLink | null {
	const cleaned = value.trim();
	if (!cleaned) return null;

	const pipeIndex = cleaned.indexOf('|');
	const rawLabel = pipeIndex >= 0 ? cleaned.slice(0, pipeIndex).trim() : '';
	const href = pipeIndex >= 0 ? cleaned.slice(pipeIndex + 1).trim() : cleaned;
	if (!href) return null;

	return {
		href,
		label: rawLabel || fallbackReferenceLabel(href),
		external: /^https?:\/\//i.test(href)
	};
}

function fallbackReferenceLabel(href: string): string {
	try {
		const url = new URL(href);
		const shortPath = url.pathname.replace(/\/$/, '');
		return `${url.hostname.replace(/^www\./, '')}${shortPath === '' || shortPath === '/' ? '' : shortPath}`;
	} catch {
		return href;
	}
}
