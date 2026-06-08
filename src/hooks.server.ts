import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { localeToLanguageTag, resolveLocaleFromPathname } from '$lib/i18n/locales';
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

	const languageTag = localeToLanguageTag(resolveLocaleFromPathname(event.url.pathname));

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="en">', `<html lang="${languageTag}">`)
	});
};
