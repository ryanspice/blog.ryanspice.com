import { json } from '@sveltejs/kit';

// This stub exists so SvelteKit registers the /drafts/owner/private route. Production
// (php-static) always selects the sibling +server.php, which performs the
// server-side Microsoft owner check before reading private draft data. The Node
// dev server must not become a second, unreviewed private-data implementation.
export const prerender = false;

export function GET() {
	return json(
		{ ok: false, error: 'php_runtime_required' },
		{
			status: 503,
			headers: {
				'Cache-Control': 'no-store'
			}
		}
	);
}
