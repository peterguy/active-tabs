import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { fetchPageMetadata } from '$lib/server/content-fetcher';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const url = formData.get('url')?.toString().trim();
		let title = formData.get('title')?.toString().trim() || null;
		let description = formData.get('description')?.toString().trim() || null;
		const pinned = formData.get('pinned') === 'on';

		if (!url) {
			return fail(400, { error: 'URL is required', url, title, description });
		}

		try {
			new URL(url);
		} catch {
			return fail(400, { error: 'Invalid URL format', url, title, description });
		}

		// Auto-fetch metadata if title or description not provided
		let favicon: string | null = null;
		if (!title || !description) {
			const metadata = await fetchPageMetadata(url);
			if (!title && metadata.title) {
				title = metadata.title;
			}
			if (!description && metadata.description) {
				description = metadata.description;
			}
			favicon = metadata.favicon;
		}

		const now = new Date();

		await db.insert(links).values({
			id: randomUUID(),
			url,
			title,
			description,
			favicon,
			pinned,
			createdAt: now,
			updatedAt: now
		});

		throw redirect(303, '/');
	}
};
