import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { renderRssFriendlyHtml } from '$lib/rss-friendly-html';

export const handle: Handle = async ({ event, resolve }) => {
	if (!building && event.url.pathname.endsWith('/rss.xml/')) {
		return new Response(renderRssFriendlyHtml(event.url), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=300'
			}
		});
	}

	return resolve(event);
};
