import { articleCanonicalPath } from './article-paths';
import type { SupportedLocale } from './i18n/locales';
import type { SiteId } from './site-config';

export const ARTICLE_SURFACES = ['ryan', 'canopy-blog', 'canopy-engineering'] as const;
export type ArticleSurface = (typeof ARTICLE_SURFACES)[number];

export const DEFAULT_ARTICLE_SURFACES: ArticleSurface[] = [...ARTICLE_SURFACES];

export type ArticleSurfaceInput = {
	date: string;
	locale: SupportedLocale;
	slug: string;
	canonicalSurface?: ArticleSurface;
	surfaces: ArticleSurface[];
};

const SURFACE_ORIGINS: Record<ArticleSurface, string> = {
	ryan: 'https://blog.ryanspice.com',
	'canopy-blog': 'https://blog.canopydigital.ca',
	'canopy-engineering': 'https://canopydigital.ca'
};

export function parseArticleSurface(value: string | undefined): ArticleSurface | undefined {
	return ARTICLE_SURFACES.find((surface) => surface === value?.trim().toLowerCase());
}

/** Canonical ownership is deliberately limited to the two primary blogs. */
export function parseCanonicalOwner(value: string | undefined): ArticleSurface {
	const normalized = value?.trim().toLowerCase();
	if (!normalized) return 'ryan';
	if (normalized === 'ryan') return 'ryan';
	if (normalized === 'canopy' || normalized === 'canopy-blog') return 'canopy-blog';
	throw new Error(`Invalid canonical owner "${value}". Expected "ryan" or "canopy".`);
}

export function parseArticleSurfaces(values: string[]): ArticleSurface[] {
	const parsed = values.map(parseArticleSurface).filter((surface): surface is ArticleSurface => Boolean(surface));
	return parsed.length ? Array.from(new Set(parsed)) : [...DEFAULT_ARTICLE_SURFACES];
}

export function articleSurfacePath(article: Pick<ArticleSurfaceInput, 'date' | 'locale' | 'slug'>, surface: ArticleSurface): string {
	const blogPath = articleCanonicalPath(article);
	if (surface !== 'canopy-engineering') return blogPath;

	if (article.locale === 'fr') {
		return `/fr/engineering${blogPath.replace(/^\/fr/, '')}`;
	}

	return `/engineering${blogPath}`;
}

export function articleSurfaceUrl(article: Pick<ArticleSurfaceInput, 'date' | 'locale' | 'slug'>, surface: ArticleSurface): string {
	return new URL(articleSurfacePath(article, surface), SURFACE_ORIGINS[surface]).toString();
}

export function articleCanonicalUrl(article: ArticleSurfaceInput, fallbackOrigin: string): string {
	return article.canonicalSurface
		? articleSurfaceUrl(article, article.canonicalSurface)
		: new URL(articleCanonicalPath(article), fallbackOrigin).toString();
}

export function isArticleEnabledForSurface(article: Pick<ArticleSurfaceInput, 'surfaces'>, surface: ArticleSurface): boolean {
	return article.surfaces.includes(surface);
}

export function siteIdToArticleSurface(siteId: SiteId): ArticleSurface {
	return siteId === 'canopy' ? 'canopy-blog' : 'ryan';
}

export function isCanonicalForSite(article: Pick<ArticleSurfaceInput, 'canonicalSurface'>, siteId: SiteId): boolean {
	return (article.canonicalSurface ?? 'ryan') === siteIdToArticleSurface(siteId);
}
