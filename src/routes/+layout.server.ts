import { resolveSiteAccent } from '$lib/site-accent.server';

export async function load() {
	return {
		siteAccent: await resolveSiteAccent()
	};
}
