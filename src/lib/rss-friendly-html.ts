import { articleCanonicalPath } from './article-paths';
import { getPublishedArticlesForLocale } from './articles';
import { resolveLocaleFromPathname } from './i18n/locales';
import { getSiteConfig, getSiteDictionary } from './server/site';

export function renderRssFriendlyHtml(url: URL): string {
	const locale = resolveLocaleFromPathname(url.pathname);
	const site = getSiteConfig();
	const copy = getSiteDictionary(locale, site).rss;
	const prefix = url.pathname.slice(0, -'/rss.xml/'.length);
	const basePath = prefix === '' ? '' : prefix;
	const feedPath = `${basePath}/rss.xml`;
	const homePath = `${basePath}/`;
	const readerPath = `${basePath}/rss-reader/`;
	const latestItems = getPublishedArticlesForLocale(locale)
		.slice(0, 5)
		.map((article) => {
			const articlePath = pathFromFeedBase(basePath, articleCanonicalPath(article), article.locale);
			const tags = article.tags
				.slice(0, 5)
				.map((tag) => `<span>${escapeHtml(tag)}</span>`)
				.join('');

			return `
				<article>
					<p><time datetime="${escapeHtml(article.date)}">${escapeHtml(article.dateLabel)}</time> · ${article.readingMinutes} min read</p>
					<h2><a href="${escapeHtml(articlePath)}">${escapeHtml(article.title)}</a></h2>
					<p>${escapeHtml(article.summary)}</p>
					<div class="tags">${tags}</div>
				</article>
			`;
		})
		.join('');

	return `<!doctype html>
<html lang="${escapeHtml(locale === 'fr' ? 'fr-CA' : 'en')}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex,follow">
	<title>${escapeHtml(copy.title)}</title>
	<link rel="canonical" href="${escapeHtml(new URL(`${basePath}/rss.xml/`, url.origin).toString())}">
	<link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.rssTitle)}" href="${escapeHtml(feedPath)}">
	<style>
		:root { color-scheme: dark; }
		* { box-sizing: border-box; }
		body {
			margin: 0;
			background: #050505;
			color: rgba(255,255,255,.94);
			font: 17px/1.65 "Segoe UI", system-ui, sans-serif;
		}
		main { width: min(1120px, calc(100vw - 32px)); margin: 0 auto; padding: 64px 0 80px; }
		a { color: #78d4ff; }
		h1 { max-width: 760px; margin: 0 0 14px; font-size: clamp(34px, 6vw, 64px); line-height: 1; letter-spacing: 0; }
		.dek { max-width: 760px; color: rgba(255,255,255,.68); font-size: 20px; }
		.actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0 42px; }
		.actions a, article { border: 1px solid rgba(255,255,255,.14); border-radius: 8px; background: rgba(255,255,255,.035); }
		.actions a { padding: 10px 14px; color: white; text-decoration: none; font-weight: 700; }
		section { display: grid; gap: 14px; border-top: 1px solid rgba(255,255,255,.12); padding-top: 28px; }
		article { padding: 18px; border-left: 4px solid #78d4ff; }
		article h2 { margin: 0 0 8px; font-size: clamp(22px, 3vw, 34px); line-height: 1.08; }
		article h2 a { color: white; text-decoration: none; }
		article p { margin: 0 0 10px; color: rgba(255,255,255,.7); }
		.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
		.tags span { border: 1px solid rgba(255,255,255,.14); border-radius: 7px; padding: 5px 8px; color: rgba(255,255,255,.68); font-size: 13px; }
	</style>
</head>
<body>
	<main>
		<p>${escapeHtml(copy.feedLabel)}</p>
		<h1>${escapeHtml(copy.heading)}</h1>
		<p class="dek">${escapeHtml(copy.readerDek)} <a href="${escapeHtml(feedPath)}">/rss.xml</a>.</p>
		<div class="actions">
			<a href="${escapeHtml(feedPath)}">${escapeHtml(copy.openXml)}</a>
			<a href="${escapeHtml(readerPath)}">${escapeHtml(copy.openFriendlyPage)}</a>
			<a href="${escapeHtml(homePath)}">${escapeHtml(copy.backToArticles)}</a>
		</div>
		<section aria-label="${escapeHtml(copy.latestItems)}">
			${latestItems}
		</section>
	</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function pathFromFeedBase(basePath: string, canonicalPath: string, locale: string): string {
	if (!basePath || canonicalPath.startsWith(`${basePath}/`)) return canonicalPath;

	const localePrefix = locale === 'fr' ? '/fr' : '';
	if (localePrefix && basePath.endsWith(localePrefix) && canonicalPath.startsWith(`${localePrefix}/`)) {
		return `${basePath}${canonicalPath.slice(localePrefix.length)}`;
	}

	return `${basePath}${canonicalPath}`.replace(/\/+/g, '/');
}
