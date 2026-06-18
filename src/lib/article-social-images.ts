import type { ArticleMeta } from './articles';
import type { SiteConfig } from './site-config';

type ArticleShareImage = Pick<ArticleMeta, 'locale' | 'slug' | 'title'>;
type ShareImageSite = Pick<SiteConfig, 'id' | 'siteName'>;

export const ARTICLE_SHARE_IMAGE_WIDTH = 1200;
export const ARTICLE_SHARE_IMAGE_HEIGHT = 630;

export function articleShareImagePath(article: ArticleShareImage, site: ShareImageSite): string {
	const localizedSlug = article.locale === 'en' ? article.slug : `${article.locale}/${article.slug}`;
	return `/img/social/${site.id}/articles/${localizedSlug}.png`;
}

export function articleShareImageAlt(article: ArticleShareImage, site: ShareImageSite): string {
	return `${article.title} social preview for ${site.siteName}`;
}
