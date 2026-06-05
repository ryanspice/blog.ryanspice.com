import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const basePath = process.env.PUBLIC_BASE_PATH ?? '';
const prerenderOrigin = process.env.PUBLIC_SITE_URL ?? 'https://blog.ryanspice.com';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		paths: {
			base: basePath,
			relative: true
		},
		prerender: {
			origin: prerenderOrigin,
			entries: ['*', '/robots.txt', '/sitemap.xml', '/rss.xml', '/rss-reader/', '/status.json'],
			handleHttpError: ({ path, message }) => {
				if (path.startsWith('/.auth/')) return;
				throw new Error(message);
			}
		},
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		})
	}
};

export default config;
