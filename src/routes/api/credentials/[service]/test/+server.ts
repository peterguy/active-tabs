import { json } from '@sveltejs/kit';
import { getCredential, type ServiceType } from '$lib/server/credentials';
import { getValidAccessToken } from '$lib/server/google-oauth';
import type { RequestHandler } from './$types';

interface TestResult {
	success: boolean;
	message: string;
	details?: string;
}

export const POST: RequestHandler = async ({ params }) => {
	const service = params.service as ServiceType;

	try {
		const result = await testService(service);
		return json(result);
	} catch (error) {
		return json({
			success: false,
			message: 'Test failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};

async function testService(service: ServiceType): Promise<TestResult> {
	switch (service) {
		case 'github':
			return testGitHub();
		case 'slack':
			return testSlack();
		case 'linear':
			return testLinear();
		case 'notion':
			return testNotion();
		case 'google':
			return testGoogle();
		default:
			return { success: false, message: 'Unknown service' };
	}
}

async function testGitHub(): Promise<TestResult> {
	const cred = await getCredential('github');
	if (!cred) return { success: false, message: 'No credentials configured' };

	const response = await fetch('https://api.github.com/user', {
		headers: {
			'Authorization': `Bearer ${cred.token}`,
			'Accept': 'application/vnd.github.v3+json',
			'User-Agent': 'ActiveTabs/1.0'
		}
	});

	if (!response.ok) {
		const text = await response.text();
		return { success: false, message: 'Authentication failed', details: text };
	}

	const data = await response.json();
	return { success: true, message: `Connected as ${data.login}` };
}

async function testSlack(): Promise<TestResult> {
	const cred = await getCredential('slack');
	if (!cred) return { success: false, message: 'No credentials configured' };

	const response = await fetch('https://slack.com/api/auth.test', {
		headers: { 'Authorization': `Bearer ${cred.token}` }
	});

	const data = await response.json();

	if (!data.ok) {
		return { success: false, message: 'Authentication failed', details: data.error };
	}

	return { success: true, message: `Connected as ${data.user} in ${data.team}` };
}

async function testLinear(): Promise<TestResult> {
	const cred = await getCredential('linear');
	if (!cred) return { success: false, message: 'No credentials configured' };

	const response = await fetch('https://api.linear.app/graphql', {
		method: 'POST',
		headers: {
			'Authorization': cred.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: `query { viewer { id name email } }`
		})
	});

	if (!response.ok) {
		const text = await response.text();
		return { success: false, message: 'Authentication failed', details: text };
	}

	const data = await response.json();
	if (data.errors) {
		return { success: false, message: 'GraphQL error', details: data.errors[0]?.message };
	}

	const viewer = data.data?.viewer;
	return { success: true, message: `Connected as ${viewer?.name || viewer?.email || 'Unknown'}` };
}

async function testNotion(): Promise<TestResult> {
	const cred = await getCredential('notion');
	if (!cred) return { success: false, message: 'No credentials configured' };

	const response = await fetch('https://api.notion.com/v1/users/me', {
		headers: {
			'Authorization': `Bearer ${cred.token}`,
			'Notion-Version': '2022-06-28'
		}
	});

	if (!response.ok) {
		const text = await response.text();
		return { success: false, message: 'Authentication failed', details: text };
	}

	const data = await response.json();
	const name = data.name || data.bot?.owner?.user?.name || 'Integration';
	return { success: true, message: `Connected as ${name}` };
}

async function testGoogle(): Promise<TestResult> {
	const accessToken = await getValidAccessToken();
	if (!accessToken) return { success: false, message: 'No credentials configured or token expired' };

	// Use Drive API to test since we have drive.readonly scope
	const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
		headers: { 'Authorization': `Bearer ${accessToken}` }
	});

	if (!response.ok) {
		const text = await response.text();
		return { success: false, message: 'Authentication failed', details: text };
	}

	const data = await response.json();
	const displayName = data.user?.displayName || data.user?.emailAddress || 'Google User';
	return { success: true, message: `Connected as ${displayName}` };
}
