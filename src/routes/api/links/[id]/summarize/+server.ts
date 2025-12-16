import { db } from '$lib/server/db';
import { links } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import { generateSummary, fetchPageContent, isOllamaAvailable } from '$lib/server/ollama';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const link = await db.query.links.findFirst({
		where: eq(links.id, params.id)
	});

	if (!link) {
		throw error(404, 'Link not found');
	}

	const available = await isOllamaAvailable();
	if (!available) {
		throw error(503, 'Ollama is not available. Make sure it is running on localhost:11434');
	}

	const body = await request.json().catch(() => ({}));
	const model = body.model as string | undefined;
	const force = body.force as boolean | undefined;

	if (link.summary && !force) {
		return json({ success: true, summary: link.summary, cached: true });
	}

	const content = await fetchPageContent(link.url);
	if (!content) {
		throw error(400, 'Could not fetch page content for summarization');
	}

	const result = await generateSummary(content, link.url, link.title, model);
	if (!result) {
		throw error(500, 'Failed to generate summary');
	}

	await db
		.update(links)
		.set({ summary: result.summary, updatedAt: new Date() })
		.where(eq(links.id, params.id));

	return json({
		success: true,
		summary: result.summary,
		model: result.model,
		cached: false
	});
};
