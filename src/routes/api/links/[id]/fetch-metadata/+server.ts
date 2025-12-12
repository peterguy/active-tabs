import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import { fetchPageMetadata } from '$lib/server/content-fetcher';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const link = await db.query.links.findFirst({
		where: eq(links.id, params.id)
	});

	if (!link) {
		throw error(404, 'Link not found');
	}

	const metadata = await fetchPageMetadata(link.url);

	const updates: Record<string, unknown> = {
		updatedAt: new Date()
	};

	if (metadata.title && !link.title) {
		updates.title = metadata.title;
	}
	if (metadata.description && !link.description) {
		updates.description = metadata.description;
	}
	if (metadata.favicon) {
		updates.favicon = metadata.favicon;
	}

	await db.update(links).set(updates).where(eq(links.id, params.id));

	return json({
		success: true,
		metadata,
		updated: Object.keys(updates).filter(k => k !== 'updatedAt')
	});
};
