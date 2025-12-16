import { redirect } from '@sveltejs/kit';
import { getGoogleOAuthConfig } from '$lib/server/google-oauth';
import type { RequestHandler } from './$types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
	'https://www.googleapis.com/auth/drive.metadata.readonly',
	'https://www.googleapis.com/auth/documents.readonly',
	'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

export const GET: RequestHandler = async ({ url }) => {
	const config = await getGoogleOAuthConfig();

	if (!config) {
		throw redirect(302, '/settings?error=google_not_configured');
	}

	const redirectUri = `${url.origin}/api/auth/google/callback`;
	const state = crypto.randomUUID();

	const authUrl = new URL(GOOGLE_AUTH_URL);
	authUrl.searchParams.set('client_id', config.clientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', SCOPES);
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');
	authUrl.searchParams.set('state', state);

	throw redirect(302, authUrl.toString());
};
