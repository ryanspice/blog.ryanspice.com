import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { visibleMorningBriefs } from '$lib/morning-briefs';

export const csr = true;

export function entries() {
	return visibleMorningBriefs.map((brief) => ({ slug: brief.slug }));
}

export const load: PageServerLoad = ({ params }) => {
	const brief = visibleMorningBriefs.find((item) => item.slug === params.slug);

	if (!brief) {
		throw error(404, 'Morning brief not found');
	}

	return { slug: params.slug };
};
