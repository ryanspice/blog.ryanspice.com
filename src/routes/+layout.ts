import { env } from '$env/dynamic/public';
import { resolveSiteId } from '$lib/site-config';

export const prerender = true;
export const trailingSlash = 'always';

// The Canopy build is a public, prerendered static skin. Do not hydrate it,
// because client route data can otherwise rewrite stamped document theme state.
export const csr = resolveSiteId(env.PUBLIC_SITE_ID) !== 'canopy';
