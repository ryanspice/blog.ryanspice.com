import { redirect } from '@sveltejs/kit';

export const prerender = false;
export const csr = true;

export function load({ params }: { params: { slug: string } }) {
	const slug = typeof params.slug === 'string' ? params.slug : '';
	redirect(302, slug ? `/drafts/?slug=${encodeURIComponent(slug)}` : '/drafts/');
}
