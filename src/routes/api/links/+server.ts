import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fetchPageMetadata } from '$lib/server/content-fetcher';
import type { RequestHandler } from './$types';

function normalizeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		let normalized = `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}`;
		if (normalized.endsWith('/') && normalized !== `${parsed.protocol}//${parsed.host.toLowerCase()}/`) {
			normalized = normalized.slice(0, -1);
		}
		if (parsed.search) normalized += parsed.search;
		if (parsed.hash) normalized += parsed.hash;
		return normalized;
	} catch {
		return url;
	}
}

export const GET: RequestHandler = async () => {
	const allLinks = await db.query.links.findMany({
		with: {
			linkTags: {
				with: {
					tag: true
				}
			}
		},
		orderBy: [
			desc(links.pinned),
			links.sortOrder,
			desc(links.createdAt)
		]
	});

	return json({
		links: allLinks.map(link => ({
			id: link.id,
			url: link.url,
			title: link.title,
			description: link.description,
			favicon: link.favicon,
			pinned: link.pinned,
			tags: link.linkTags.map(lt => ({
				id: lt.tag.id,
				name: lt.tag.name,
				color: lt.tag.color
			})),
			createdAt: link.createdAt
		}))
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const url = body.url?.toString().trim();
	let title = body.title?.toString().trim() || null;
	let description = body.description?.toString().trim() || null;

	if (!url) {
		return json({ error: 'URL is required' }, { status: 400 });
	}

	try {
		new URL(url);
	} catch {
		return json({ error: 'Invalid URL format' }, { status: 400 });
	}

	// Check for duplicate URL
	const normalizedUrl = normalizeUrl(url);
	const existingLinks = await db.select().from(links).where(eq(links.url, url));

	let existingLink = existingLinks[0];
	if (!existingLink && normalizedUrl !== url) {
		const normalizedLinks = await db.select().from(links).where(eq(links.url, normalizedUrl));
		existingLink = normalizedLinks[0];
	}

	if (existingLink) {
		return json({
			error: 'This link already exists',
			existingLinkId: existingLink.id,
			existingLinkTitle: existingLink.title || existingLink.url
		}, { status: 409 });
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
	const id = randomUUID();

	// Shift all existing sort orders down to make room at the top
	await db.update(links).set({ sortOrder: sql`${links.sortOrder} + 1` });

	await db.insert(links).values({
		id,
		url,
		title,
		description,
		favicon,
		pinned: false,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now
	});

	return json({
		success: true,
		link: { id, url, title, description, favicon, pinned: false, tags: [], createdAt: now }
	}, { status: 201 });
};
