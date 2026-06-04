import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { draftArticles } from '$lib/articles';
import { assertOwnerAccessToken, saveDraftMetadata } from '$lib/server/draft-metadata';

export const prerender = false;

export const load: PageServerLoad = ({ params }) => {
	const article = draftArticles.find((item) => item.slug === params.slug);

	if (!article) {
		throw error(404, 'Draft not found');
	}

	return { slug: params.slug };
};

export const actions: Actions = {
	save: async ({ params, request }) => {
		const formData = await request.formData();
		const ownerToken = formData.get('owner_token');

		try {
			if (typeof ownerToken !== 'string') {
				return fail(401, { metadataSave: { ok: false, message: 'Missing Microsoft owner token.' } });
			}

			await assertOwnerAccessToken(ownerToken);
			const result = await saveDraftMetadata(params.slug, formData);
			return { metadataSave: { ok: true, message: result.message, fileName: result.fileName } };
		} catch (error_) {
			const message = error_ instanceof Error ? error_.message : 'Unable to save draft metadata.';
			return fail(400, { metadataSave: { ok: false, message } });
		}
	}
};
