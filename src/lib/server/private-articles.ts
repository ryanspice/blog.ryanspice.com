import { isPublicArticle } from '../article-publication';
import {
	finalizeArticleCatalog,
	parseArticle,
	type Article,
	type ArticleSource,
	type VersionSourceMap
} from '../article-core';

type RawArticleModule = Record<string, string>;

// This module must stay under src/lib/server. It is the only place that reads
// unpublished Markdown eagerly. The build script loads it through Vite SSR and
// writes the resulting private payload outside the deployable build directory.
const mainModules = import.meta.glob('../content/articles/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const localizedModules = import.meta.glob('../content/articles/fr/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const versionModules = import.meta.glob('../content/articles/.versions/**/*.md', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as RawArticleModule;

const sources: ArticleSource[] = [
	...Object.entries(mainModules).map(([path, raw]) => ({
		path: path.replace('../content/articles/', './content/articles/'),
		raw
	})),
	...Object.entries(localizedModules).map(([path, raw]) => ({
		path: path.replace('../content/articles/', './content/articles/'),
		raw
	}))
];

const versionSources: VersionSourceMap = Object.fromEntries(
	Object.entries(versionModules).map(([path, raw]) => [
		path.replace('../content/articles/', './content/articles/'),
		raw
	])
);

const parsedArticles = await Promise.all(
	sources.map(({ path, raw }) => parseArticle(path, raw, versionSources))
);

const catalog = finalizeArticleCatalog(parsedArticles);

/**
 * Full private article records for the build-time generator. These records are
 * never imported by client code and include the raw body only so the generator
 * can decide what to omit from the delivered JSON.
 */
export const privateArticles: Article[] = catalog.filter((article) => !isPublicArticle(article));

export const privateArticleSlugs = privateArticles.map((article) => article.slug).sort();
