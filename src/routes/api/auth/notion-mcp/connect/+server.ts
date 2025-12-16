import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initNotionMCP } from '$lib/server/mcp-notion';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = `${url.protocol}//${url.host}`;
	
	try {
		const result = await initNotionMCP(baseUrl);
		
		if (result.needsAuth && result.authUrl) {
			// Redirect to Notion's OAuth page
			throw redirect(302, result.authUrl);
		}
		
		// Already connected
		return json({ success: true, message: 'Already connected to Notion MCP' });
	} catch (error) {
		if ((error as { status?: number }).status === 302) {
			throw error; // Re-throw redirects
		}
		console.error('Failed to init Notion MCP:', error);
		return json({ success: false, error: String(error) }, { status: 500 });
	}
};
