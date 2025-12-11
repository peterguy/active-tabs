import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	await db
		.update(links)
		.set({
			clickCount: sql`${links.clickCount} + 1`,
			lastClickedAt: new Date()
		})
		.where(eq(links.id, params.id));

	return json({ success: true });
};
