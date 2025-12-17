import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import { fetchPageMetadata } from '$lib/server/content-fetcher';
import { generateSummary, isOllamaAvailable } from '$lib/server/ollama';
import { fetchServiceContent, getServiceForUrl } from '$lib/server/service-fetchers';
import type { RequestHandler } from './$types';

async function fetchContentForSummary(url: string): Promise<string | null> {
	// Try service-specific content first
	const service = getServiceForUrl(url);
	if (service) {
		const content = await fetchServiceContent(url);
		if (content) return content;
	}
	
	// Fall back to fetching page content via simple HTTP
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ActiveTabs/1.0)',
				Accept: 'text/html,application/xhtml+xml'
			},
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return null;
		const html = await response.text();
		// Basic text extraction
		return html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 8000);
	} catch {
		return null;
	}
}

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

	// Always update with fresh metadata when explicitly refreshing
	if (metadata.title) {
		updates.title = metadata.title;
	}
	if (metadata.description) {
		updates.description = metadata.description;
	}
	if (metadata.favicon) {
		updates.favicon = metadata.favicon;
	}

	// Auto-generate summary if Ollama is available
	let summary: string | null = null;
	const ollamaAvailable = await isOllamaAvailable();
	if (ollamaAvailable) {
		const content = await fetchContentForSummary(link.url);
		if (content) {
			const result = await generateSummary(content, link.url, metadata.title || link.title);
			if (result) {
				summary = result.summary;
				updates.summary = summary;
			}
		}
	}

	await db.update(links).set(updates).where(eq(links.id, params.id));

	return json({
		success: true,
		metadata,
		summary,
		updated: Object.keys(updates).filter(k => k !== 'updatedAt')
	});
};
