import { getArticleAlternates, getPublishedArticlesForSurface } from '$lib/articles';
import { articleCanonicalUrl, articleSurfacePath, articleSurfaceUrl } from '$lib/article-surfaces';

export const prerender = true;
export const trailingSlash = 'never';

const CANOPY_BLOG_ORIGIN = 'https://blog.canopydigital.ca';

function absoluteBlogAsset(value: string): string {
	if (/^https?:\/\//i.test(value)) return value;
	return new URL(value.startsWith('/') ? value : `/${value}`, CANOPY_BLOG_ORIGIN).toString();
}

function sourceFromReference(value: string) {
	const [label, ...hrefParts] = value.split('|');
	const href = (hrefParts.length ? hrefParts.join('|') : label).trim();
	if (!/^https?:\/\//i.test(href)) return null;

	const url = new URL(href);
	return {
		title: hrefParts.length ? label.trim() : url.hostname.replace(/^www\./, ''),
		href: url.toString(),
		host: url.hostname.replace(/^www\./, '')
	};
}

export const GET = () => {
	const articles = getPublishedArticlesForSurface('canopy-engineering').map((article) => {
		const canonicalHref = article.canonicalSurface
			? articleCanonicalUrl(article, CANOPY_BLOG_ORIGIN)
			: articleSurfaceUrl(article, 'canopy-blog');
		const imageSrc = article.visuals.focal?.src
			? absoluteBlogAsset(article.visuals.focal.src)
			: `${CANOPY_BLOG_ORIGIN}/img/social/canopy/articles/${article.slug}.png`;
		const sources = [...article.references, ...article.furtherReading]
			.map(sourceFromReference)
			.filter((source): source is NonNullable<typeof source> => source !== null)
			.slice(0, 8);

		return {
			publicationId: article.publicationId,
			slug: article.slug,
			locale: article.locale,
			title: article.title,
			summary: article.summary,
			published: article.date,
			updated: article.updatedDate,
			kicker: article.tags[0] ?? (article.locale === 'fr' ? "Note d'ingenierie" : 'Engineering note'),
			tags: article.tags,
			projects: article.projects,
			translationStatus: article.translationStatus ?? (article.locale === 'fr' ? 'review-needed' : 'source'),
			canonicalHref,
			localPath: articleSurfacePath(article, 'canopy-engineering'),
			sourceHref: articleSurfaceUrl(article, 'canopy-blog'),
			alternates: getArticleAlternates(article).map((alternate) => ({
				hreflang: alternate.hreflang,
				href: alternate.article.canonicalSurface
					? articleCanonicalUrl(alternate.article, CANOPY_BLOG_ORIGIN)
					: articleSurfaceUrl(alternate.article, 'canopy-blog')
			})),
			image: {
				src: imageSrc,
				alt: article.visuals.focal?.alt ?? `${article.title} social preview`,
				width: 1200,
				height: 630
			},
			sources,
			html: article.html
		};
	});

	return new Response(
		JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), articles }),
		{
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=900'
			}
		}
	);
};
