import adapter from '@sveltejs/adapter-static';

const basePath = process.env.PUBLIC_BASE_PATH ?? '';
const prerenderOrigin = process.env.PUBLIC_SITE_URL ?? 'https://blog.ryanspice.com';

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
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		})
	}
};

export default config;
