import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
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

		const now = new Date();

		await db.insert(links).values({
			id: randomUUID(),
			url,
			title,
			description,
			pinned,
			createdAt: now,
			updatedAt: now
		});

		throw redirect(303, '/');
	}
};
