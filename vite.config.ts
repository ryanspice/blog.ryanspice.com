import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

function isInsideOrSame(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

const svelteKitOutDir = process.env.SVELTEKIT_OUTDIR;
const usesExternalSvelteKitOutDir = svelteKitOutDir
	? !isInsideOrSame(process.cwd(), path.resolve(svelteKitOutDir))
	: false;

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
