import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allLinks = await db
		.select()
		.from(links)
		.orderBy(
			desc(links.pinned),
			desc(links.lastClickedAt),
			desc(links.clickCount),
			desc(links.createdAt)
		);

	return {
		links: allLinks
	};
};
