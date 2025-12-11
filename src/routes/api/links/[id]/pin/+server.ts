import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const { pinned } = await request.json();

	await db
		.update(links)
		.set({
			pinned,
			updatedAt: new Date()
		})
		.where(eq(links.id, params.id));

	return json({ success: true, pinned });
};
