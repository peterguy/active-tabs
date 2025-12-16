import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchNotionPageViaMCP, isNotionMCPConnected } from '$lib/server/mcp-notion';

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();
	
	if (!url) {
		return json({ success: false, error: 'URL required' }, { status: 400 });
	}
	
	if (!isNotionMCPConnected()) {
		return json({ success: false, error: 'Notion MCP not connected. Connect first at /api/auth/notion-mcp/connect' }, { status: 401 });
	}
	
	try {
		const result = await fetchNotionPageViaMCP(url);
		if (result) {
			return json({ success: true, title: result.title });
		} else {
			return json({ success: false, error: 'Could not fetch page' });
		}
	} catch (error) {
		console.error('MCP fetch error:', error);
		return json({ success: false, error: String(error) }, { status: 500 });
	}
};
