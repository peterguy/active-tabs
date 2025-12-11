import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const link = await db.query.links.findFirst({
		where: eq(links.id, params.id)
	});

	if (!link) {
		throw error(404, 'Link not found');
	}

	return { link };
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const formData = await request.formData();
		const url = formData.get('url')?.toString().trim();
		const title = formData.get('title')?.toString().trim() || null;
		const description = formData.get('description')?.toString().trim() || null;
		const pinned = formData.get('pinned') === 'on';

		if (!url) {
			return fail(400, { error: 'URL is required', url, title, description });
		}

		try {
			new URL(url);
		} catch {
			return fail(400, { error: 'Invalid URL format', url, title, description });
		}

		await db
			.update(links)
			.set({
				url,
				title,
				description,
				pinned,
				updatedAt: new Date()
			})
			.where(eq(links.id, params.id));

		throw redirect(303, '/');
	},

	delete: async ({ params }) => {
		await db.delete(links).where(eq(links.id, params.id));
		throw redirect(303, '/');
	}
};
