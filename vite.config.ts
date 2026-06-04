import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

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

export default defineConfig({
	plugins: [rssSlashPreviewRewrite(), sveltekit()],
	server: {
		fs: {
			strict: true
		}
	}
});
