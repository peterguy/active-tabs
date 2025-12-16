import { exchangeCodeForTokens } from '$lib/server/google-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	let status: 'success' | 'error' = 'error';
	let message = '';

	if (error) {
		console.error('Google OAuth error:', error);
		message = error;
	} else if (!code) {
		message = 'No authorization code received';
	} else {
		const redirectUri = `${url.origin}/api/auth/google/callback`;
		const tokens = await exchangeCodeForTokens(code, redirectUri);

		if (tokens) {
			status = 'success';
			message = 'Connected to Google successfully!';
		} else {
			message = 'Failed to exchange authorization code';
		}
	}

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Google Authentication</title>
			<style>
				body {
					font-family: system-ui, -apple-system, sans-serif;
					background: #0f172a;
					color: #f1f5f9;
					display: flex;
					align-items: center;
					justify-content: center;
					height: 100vh;
					margin: 0;
				}
				.container {
					text-align: center;
					padding: 2rem;
				}
				.icon { font-size: 3rem; margin-bottom: 1rem; }
				.message { font-size: 1.1rem; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="icon">${status === 'success' ? '✅' : '❌'}</div>
				<p class="message">${message}</p>
				<p>This window will close automatically...</p>
			</div>
			<script>
				setTimeout(() => window.close(), 1500);
			</script>
		</body>
		</html>
	`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html' }
	});
};
