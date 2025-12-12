import { redirect, error } from '@sveltejs/kit';
import { exchangeCodeForTokens } from '$lib/server/google-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	if (errorParam) {
		throw redirect(303, `/settings?error=google_auth_denied`);
	}

	if (!code) {
		throw error(400, 'Missing authorization code');
	}

	const savedState = cookies.get('google_oauth_state');
	if (!savedState || savedState !== state) {
		throw error(400, 'Invalid state parameter');
	}

	cookies.delete('google_oauth_state', { path: '/' });

	const redirectUri = `${url.origin}/auth/google/callback`;
	const tokens = await exchangeCodeForTokens(code, redirectUri);

	if (!tokens) {
		throw redirect(303, '/settings?error=google_token_exchange_failed');
	}

	throw redirect(303, '/settings?success=google_connected');
};
