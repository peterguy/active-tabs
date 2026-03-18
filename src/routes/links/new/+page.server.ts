import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { fetchPageMetadata } from '$lib/server/content-fetcher';
import type { Actions } from './$types';

function normalizeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		// Remove trailing slash, lowercase host
		let normalized = `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}`;
		if (normalized.endsWith('/') && normalized !== `${parsed.protocol}//${parsed.host.toLowerCase()}/`) {
			normalized = normalized.slice(0, -1);
		}
		// Keep query string and hash if present
		if (parsed.search) normalized += parsed.search;
		if (parsed.hash) normalized += parsed.hash;
		return normalized;
	} catch {
		return url;
	}
}

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

		// Check for duplicate URL
		const normalizedUrl = normalizeUrl(url);
		const existingLinks = await db.select().from(links).where(eq(links.url, url));
		
		// Also check normalized version if different
		let existingLink = existingLinks[0];
		if (!existingLink && normalizedUrl !== url) {
			const normalizedLinks = await db.select().from(links).where(eq(links.url, normalizedUrl));
			existingLink = normalizedLinks[0];
		}
		
		if (existingLink) {
			return fail(400, { 
				error: 'This link already exists',
				existingLinkId: existingLink.id,
				existingLinkTitle: existingLink.title || existingLink.url,
				url, 
				title, 
				description 
			});
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
