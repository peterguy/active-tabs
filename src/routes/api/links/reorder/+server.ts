import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { orderedIds } = await request.json() as { orderedIds: string[] };
	
	for (let i = 0; i < orderedIds.length; i++) {
		await db.update(links)
			.set({ sortOrder: i })
			.where(eq(links.id, orderedIds[i]));
	}
	
	return json({ success: true });
};
