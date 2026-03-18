import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { orderedIds, movedId } = await request.json() as { orderedIds: string[]; movedId?: string };
	
	const now = new Date();
	for (let i = 0; i < orderedIds.length; i++) {
		const isMovedLink = orderedIds[i] === movedId;
		await db.update(links)
			.set({ 
				sortOrder: i,
				// Mark the moved link as manually sorted
				...(isMovedLink ? { lastManualSort: now } : {})
			})
			.where(eq(links.id, orderedIds[i]));
	}
	
	return json({ success: true });
};
