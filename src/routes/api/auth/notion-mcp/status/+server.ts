import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMCPStatus, isNotionMCPConnected, listMCPTools } from '$lib/server/mcp-notion';

export const GET: RequestHandler = async () => {
	const status = getMCPStatus();
	const tools = await listMCPTools();
	return json({
		ready: isNotionMCPConnected(),
		...status,
		tools
	});
};
