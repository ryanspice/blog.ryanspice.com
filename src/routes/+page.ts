// The homepage is a static latest-articles landing page.
// Keep it server-rendered only so PHP-static production cannot hydrate over
// the prerendered article list with an empty client-side data payload.
export const csr = false;
