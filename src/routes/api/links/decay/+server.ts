import { json } from '@sveltejs/kit';
import { runLinkDecay } from '$lib/server/link-decay';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const result = await runLinkDecay();
	return json(result);
};
