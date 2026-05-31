import adapter from './adapter/index.js';

const basePath = process.env.PUBLIC_BASE_PATH ?? '';
const prerenderOrigin = process.env.PUBLIC_SITE_URL ?? 'https://blog.ryanspice.com';
const adapterFallback =
	process.env.ADAPTER_FALLBACK === undefined
		? false
		: process.env.ADAPTER_FALLBACK === 'true'
			? true
			: process.env.ADAPTER_FALLBACK;

const config = {
	kit: {
		paths: {
			base: basePath,
			relative: false
		},
		prerender: {
			origin: prerenderOrigin,
			entries: ['*', '/robots.txt', '/sitemap.xml', '/rss.xml'],
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
			strict: true
		})
	}
};

export default config;
