import { db } from '$lib/server/db';
import { links, tags, linkTags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const link = await db.query.links.findFirst({
		where: eq(links.id, params.id),
		with: {
			linkTags: {
				with: {
					tag: true
				}
			}
		}
	});

	if (!link) {
		throw error(404, 'Link not found');
	}

	const allTags = await db.select().from(tags).orderBy(tags.name);

	return {
		link: {
			...link,
			tags: link.linkTags.map(lt => lt.tag)
		},
		allTags
	};
};

export const actions: Actions = {
	update: async ({ params, request }) => {
		const formData = await request.formData();
		const url = formData.get('url')?.toString().trim();
		const title = formData.get('title')?.toString().trim() || null;
		const description = formData.get('description')?.toString().trim() || null;
		const pinned = formData.get('pinned') === 'on';
		const tagIds = formData.getAll('tags').map(t => t.toString());

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

		await db.delete(linkTags).where(eq(linkTags.linkId, params.id));
		if (tagIds.length > 0) {
			await db.insert(linkTags).values(
				tagIds.map(tagId => ({
					linkId: params.id,
					tagId
				}))
			);
		}

		throw redirect(303, '/');
	},

	delete: async ({ params }) => {
		await db.delete(links).where(eq(links.id, params.id));
		throw redirect(303, '/');
	}
};
