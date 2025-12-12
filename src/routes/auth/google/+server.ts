import { redirect } from '@sveltejs/kit';
import { getGoogleOAuthConfig } from '$lib/server/google-oauth';
import { randomUUID } from 'crypto';
import type { RequestHandler } from './$types';

const SCOPES = [
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/documents.readonly',
	'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

export const GET: RequestHandler = async ({ url, cookies }) => {
	const config = await getGoogleOAuthConfig();
	
	if (!config) {
		throw redirect(303, '/settings?error=google_not_configured');
	}

	const state = randomUUID();
	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: false, // Local development
		maxAge: 60 * 10 // 10 minutes
	});

	const redirectUri = `${url.origin}/auth/google/callback`;
	
	const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authUrl.searchParams.set('client_id', config.clientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', SCOPES);
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');
	authUrl.searchParams.set('state', state);

	throw redirect(303, authUrl.toString());
};
