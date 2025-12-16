import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { disconnectNotionMCP } from '$lib/server/mcp-notion';

export const POST: RequestHandler = async () => {
	await disconnectNotionMCP();
	return json({ success: true });
};

export const GET: RequestHandler = async () => {
	await disconnectNotionMCP();
	return json({ success: true, message: 'Disconnected from Notion MCP' });
};
