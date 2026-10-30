import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { splitFrontmatter } from './src/lib/article-frontmatter';
import { isPublicArticle } from './src/lib/article-publication';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const publicArticlesVirtualId = 'virtual:blog-public-articles';
const resolvedPublicArticlesVirtualId = `\0${publicArticlesVirtualId}`;

type ArticleSource = {
	path: string;
	raw: string;
};

function isInsideOrSame(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

const svelteKitOutDir = process.env.SVELTEKIT_OUTDIR;
const usesExternalSvelteKitOutDir = svelteKitOutDir
	? !isInsideOrSame(process.cwd(), path.resolve(svelteKitOutDir))
	: false;

function frontmatterString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

// Publication admissibility is delegated to the same helper the application
// uses at runtime. A Markdown source is public only when its frontmatter says
// so (status: published) or when its release date has been reached.
function isPublicAtBuild(raw: string): boolean {
	const { frontmatter, hasFrontmatter } = splitFrontmatter(raw);
	if (!hasFrontmatter) return false;

	return isPublicArticle({
		status: frontmatterString(frontmatter.status),
		releaseDate: frontmatterString(frontmatter.release_date) || null
	});
}

// A historical version is browser-safe only when it is independently public and
// still belongs to the current public article slug. A private or future draft
// revision must never ride along just because today's article is published.
function isPublicVersionAtBuild(raw: string, articleSlug: string): boolean {
	const { frontmatter, hasFrontmatter } = splitFrontmatter(raw);
	if (!hasFrontmatter) return false;

	const declaredSlug = frontmatterString(frontmatter.slug);
	if (declaredSlug && declaredSlug !== articleSlug) return false;

	return isPublicAtBuild(raw);
}

function slugFromSource(relativePath: string, raw: string): string {
	const filename = path.basename(relativePath, '.md');
	const { frontmatter, hasFrontmatter } = splitFrontmatter(raw);
	if (!hasFrontmatter) return filename;

	return frontmatterString(frontmatter.slug) || filename;
}

async function readArticleSources(): Promise<{
	publicArticleSources: ArticleSource[];
	publicVersionSources: Record<string, string>;
}> {
	const articlesRoot = path.join(projectRoot, 'src', 'lib', 'content', 'articles');
	const publicArticleSources: ArticleSource[] = [];
	const publicSlugs = new Set<string>();

	async function addPublishedDirectory(directory: string, publicPathPrefix: string): Promise<void> {
		let entries;
		try {
			entries = await fs.readdir(directory, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
			const absolute = path.join(directory, entry.name);
			const raw = await fs.readFile(absolute, 'utf8');
			if (!isPublicAtBuild(raw)) continue;

			const publicPath = `${publicPathPrefix}/${entry.name}`;
			publicArticleSources.push({ path: publicPath, raw });
			publicSlugs.add(slugFromSource(publicPath, raw));
		}
	}

	await addPublishedDirectory(articlesRoot, './content/articles');
	await addPublishedDirectory(path.join(articlesRoot, 'fr'), './content/articles/fr');

	const publicVersionSources: Record<string, string> = {};
	const versionsRoot = path.join(articlesRoot, '.versions');
	try {
		const slugs = await fs.readdir(versionsRoot, { withFileTypes: true });
		for (const slugEntry of slugs) {
			if (!slugEntry.isDirectory() || !publicSlugs.has(slugEntry.name)) continue;
			const versionDir = path.join(versionsRoot, slugEntry.name);
			const versions = await fs.readdir(versionDir, { withFileTypes: true });
			for (const versionEntry of versions) {
				if (!versionEntry.isFile() || !versionEntry.name.endsWith('.md')) continue;
				const relativePath = `./content/articles/.versions/${slugEntry.name}/${versionEntry.name}`;
				const raw = await fs.readFile(path.join(versionDir, versionEntry.name), 'utf8');
				if (!isPublicVersionAtBuild(raw, slugEntry.name)) continue;
				publicVersionSources[relativePath] = raw;
			}
		}
	} catch {
		// No version archive is a valid content state.
	}

	return { publicArticleSources, publicVersionSources };
}

function publicArticleSourcesPlugin(): Plugin {
	return {
		name: 'blog-public-article-sources',
		resolveId(id) {
			if (id === publicArticlesVirtualId) return resolvedPublicArticlesVirtualId;
			return null;
		},
		async load(id) {
			if (id !== resolvedPublicArticlesVirtualId) return null;
			const { publicArticleSources, publicVersionSources } = await readArticleSources();
			return [
				`export const publicArticleSources = ${JSON.stringify(publicArticleSources)};`,
				`export const publicVersionSources = ${JSON.stringify(publicVersionSources)};`,
				''
			].join('\n');
		},
		handleHotUpdate({ file, server }) {
			const articlesRoot = path.join(projectRoot, 'src', 'lib', 'content', 'articles');
			if (!isInsideOrSame(articlesRoot, file)) return;

			const module = server.moduleGraph.getModuleById(resolvedPublicArticlesVirtualId);
			if (module) server.moduleGraph.invalidateModule(module);
		}
	};
}

function rssSlashPreviewRewrite(): Plugin {
	return {
		name: 'rss-slash-preview-rewrite',
		configurePreviewServer(server) {
			server.middlewares.use((request, _response, next) => {
				const url = request.url ?? '';
				const [pathname, query = ''] = url.split('?');

				if (pathname === '/rss.xml/') {
					request.url = `/rss-reader/${query ? `?${query}` : ''}`;
				}

				next();
			});
		}
	};
}

function windowsDriveImportRewrite(): Plugin {
	return {
		name: 'windows-drive-import-rewrite',
		enforce: 'pre',
		resolveId(source) {
			const match = /^\.\/([A-Za-z]:\/.*)$/.exec(source);
			if (match) return match[1];
			return null;
		}
	};
}

export default defineConfig({
	plugins: [
		publicArticleSourcesPlugin(),
		rssSlashPreviewRewrite(),
		...(usesExternalSvelteKitOutDir ? [windowsDriveImportRewrite()] : []),
		sveltekit()
	],
	cacheDir: process.env.VITE_CACHE_DIR ?? 'node_modules/.vite',
	ssr: usesExternalSvelteKitOutDir ? { noExternal: true } : undefined,
	server: {
		fs: {
			strict: true
		}
	}
});
