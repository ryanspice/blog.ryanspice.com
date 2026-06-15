import adapter from './adapter/index.js';

const basePath = process.env.PUBLIC_BASE_PATH ?? '';
const prerenderOrigin = process.env.PUBLIC_SITE_URL ?? 'https://blog.ryanspice.com';
const siteId = (process.env.PUBLIC_SITE_ID ?? process.env.BLOG_SITE_ID ?? 'ryan').trim().toLowerCase();
const adapterFallback =
	process.env.ADAPTER_FALLBACK === undefined
		? false
		: process.env.ADAPTER_FALLBACK === 'true'
			? true
			: process.env.ADAPTER_FALLBACK;
const buildIdentity =
	siteId === 'canopy'
		? {
				name: 'canopy-static-skin',
				required: ['site-shell--canopy'],
				forbidden: ['site-shell--ryan', 'themeClass:"ryan"']
			}
		: {
				name: 'ryan-static-skin',
				required: ['site-shell--ryan'],
				forbidden: ['site-shell--canopy', 'themeClass:"canopy"']
			};

const config = {
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
			mode: process.env.ADAPTER_MODE ?? 'php-static',
			baseMode: process.env.ADAPTER_BASE_MODE ?? 'fixed',
			basePath,
			ssr: true,
			out: process.env.ADAPTER_OUT ?? 'build',
			assets: process.env.ADAPTER_ASSETS ?? 'build',
			precompress: process.env.PRECOMPRESS === 'true',
			fallback: adapterFallback,
			strict: true,
			buildIdentity
		})
	}
};

export default config;
