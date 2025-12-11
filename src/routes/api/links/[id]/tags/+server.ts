import { db } from '$lib/server/db';
import { linkTags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const { tagIds } = await request.json() as { tagIds: string[] };

	await db.delete(linkTags).where(eq(linkTags.linkId, params.id));

	if (tagIds.length > 0) {
		await db.insert(linkTags).values(
			tagIds.map(tagId => ({
				linkId: params.id,
				tagId
			}))
		);
	}

	return json({ success: true });
};
