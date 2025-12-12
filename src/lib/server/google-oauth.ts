import { db } from './db';
import { credentials } from './db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';
import { randomUUID } from 'crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/documents.readonly',
	'https://www.googleapis.com/auth/spreadsheets.readonly'
].join(' ');

export interface GoogleOAuthConfig {
	clientId: string;
	clientSecret: string;
}

export interface GoogleTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
}

export async function saveGoogleOAuthConfig(config: GoogleOAuthConfig): Promise<void> {
	const { encrypted, iv } = encrypt(JSON.stringify({ type: 'oauth_config', ...config }));
	const now = new Date();

	const existing = await db.query.credentials.findFirst({
		where: eq(credentials.service, 'google_oauth_config')
	});

	if (existing) {
		await db
			.update(credentials)
			.set({ encryptedData: encrypted, iv, updatedAt: now })
			.where(eq(credentials.service, 'google_oauth_config'));
	} else {
		await db.insert(credentials).values({
			id: randomUUID(),
			service: 'google_oauth_config',
			type: 'oauth',
			encryptedData: encrypted,
			iv,
			createdAt: now,
			updatedAt: now
		});
	}
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig | null> {
	const cred = await db.query.credentials.findFirst({
		where: eq(credentials.service, 'google_oauth_config')
	});

	if (!cred) return null;

	try {
		const decrypted = decrypt(cred.encryptedData, cred.iv);
		const data = JSON.parse(decrypted);
		return { clientId: data.clientId, clientSecret: data.clientSecret };
	} catch {
		return null;
	}
}

export async function saveGoogleTokens(tokens: GoogleTokens): Promise<void> {
	const { encrypted, iv } = encrypt(JSON.stringify({ type: 'oauth_tokens', ...tokens }));
	const now = new Date();
	const expiresAt = new Date(tokens.expiresAt);

	const existing = await db.query.credentials.findFirst({
		where: eq(credentials.service, 'google')
	});

	if (existing) {
		await db
			.update(credentials)
			.set({ encryptedData: encrypted, iv, expiresAt, updatedAt: now })
			.where(eq(credentials.service, 'google'));
	} else {
		await db.insert(credentials).values({
			id: randomUUID(),
			service: 'google',
			type: 'oauth',
			encryptedData: encrypted,
			iv,
			expiresAt,
			createdAt: now,
			updatedAt: now
		});
	}
}

export async function getGoogleTokens(): Promise<GoogleTokens | null> {
	const cred = await db.query.credentials.findFirst({
		where: eq(credentials.service, 'google')
	});

	if (!cred) return null;

	try {
		const decrypted = decrypt(cred.encryptedData, cred.iv);
		const data = JSON.parse(decrypted);
		return {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			expiresAt: data.expiresAt
		};
	} catch {
		return null;
	}
}

export async function getValidAccessToken(): Promise<string | null> {
	const tokens = await getGoogleTokens();
	if (!tokens) return null;

	const expiresAt = new Date(tokens.expiresAt);
	const now = new Date();

	// If token expires in less than 5 minutes, refresh it
	if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
		const refreshed = await refreshAccessToken(tokens.refreshToken);
		if (refreshed) {
			return refreshed.accessToken;
		}
		return null;
	}

	return tokens.accessToken;
}

async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens | null> {
	const config = await getGoogleOAuthConfig();
	if (!config) return null;

	try {
		const response = await fetch(GOOGLE_TOKEN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				refresh_token: refreshToken,
				grant_type: 'refresh_token'
			})
		});

		if (!response.ok) return null;

		const data = await response.json();
		const tokens: GoogleTokens = {
			accessToken: data.access_token,
			refreshToken: refreshToken, // Keep the same refresh token
			expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
		};

		await saveGoogleTokens(tokens);
		return tokens;
	} catch {
		return null;
	}
}

export function getAuthorizationUrl(redirectUri: string, state: string): string {
	return `${GOOGLE_AUTH_URL}?${new URLSearchParams({
		client_id: '', // Will be filled in by caller
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: SCOPES,
		access_type: 'offline',
		prompt: 'consent',
		state
	}).toString()}`;
}

export async function exchangeCodeForTokens(
	code: string,
	redirectUri: string
): Promise<GoogleTokens | null> {
	const config = await getGoogleOAuthConfig();
	if (!config) return null;

	try {
		const response = await fetch(GOOGLE_TOKEN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				code,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code'
			})
		});

		if (!response.ok) {
			console.error('Token exchange failed:', await response.text());
			return null;
		}

		const data = await response.json();
		const tokens: GoogleTokens = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString()
		};

		await saveGoogleTokens(tokens);
		return tokens;
	} catch (error) {
		console.error('Token exchange error:', error);
		return null;
	}
}

export async function isGoogleConfigured(): Promise<boolean> {
	const config = await getGoogleOAuthConfig();
	return config !== null;
}

export async function isGoogleConnected(): Promise<boolean> {
	const tokens = await getGoogleTokens();
	return tokens !== null;
}

export async function disconnectGoogle(): Promise<void> {
	await db.delete(credentials).where(eq(credentials.service, 'google'));
}
