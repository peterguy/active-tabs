import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { completeNotionMCPAuth } from '$lib/server/mcp-notion';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');
	
	if (error) {
		console.error('Notion MCP OAuth error:', error);
		throw redirect(302, '/settings?error=notion_mcp_auth_failed');
	}
	
	if (!code) {
		throw redirect(302, '/settings?error=no_auth_code');
	}
	
	try {
		const success = await completeNotionMCPAuth(code);
		if (success) {
			throw redirect(302, '/settings?success=notion_mcp_connected');
		} else {
			throw redirect(302, '/settings?error=notion_mcp_auth_failed');
		}
	} catch (error) {
		if ((error as { status?: number }).status === 302) {
			throw error;
		}
		console.error('Failed to complete Notion MCP auth:', error);
		throw redirect(302, '/settings?error=notion_mcp_auth_failed');
	}
};
