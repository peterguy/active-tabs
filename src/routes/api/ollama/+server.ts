import { json } from '@sveltejs/kit';
import { isOllamaAvailable, listModels } from '$lib/server/ollama';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const available = await isOllamaAvailable();

	if (!available) {
		return json({ available: false, models: [] });
	}

	const models = await listModels();

	return json({ available: true, models });
};
