import { getCredential } from './credentials';
import { getValidAccessToken } from './google-oauth';
import type { PageMetadata } from './content-fetcher';

export async function fetchGitHubMetadata(url: string): Promise<PageMetadata | null> {
	const cred = await getCredential('github');
	if (!cred) return null;

	const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/);
	if (!match) return null;

	const [, owner, repo, type, number] = match;
	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${type === 'pull' ? 'pulls' : 'issues'}/${number}`;

	try {
		const response = await fetch(apiUrl, {
			headers: {
				'Authorization': `Bearer ${cred.token}`,
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'ActiveTabs/1.0'
			}
		});

		if (!response.ok) return null;

		const data = await response.json();
		const prefix = type === 'pull' ? 'PR' : 'Issue';
		
		return {
			title: `${prefix} #${number}: ${data.title}`,
			description: data.body?.slice(0, 200) || null,
			favicon: 'https://github.githubassets.com/favicons/favicon.svg'
		};
	} catch {
		return null;
	}
}

export async function fetchLinearMetadata(url: string): Promise<PageMetadata | null> {
	const cred = await getCredential('linear');
	if (!cred) return null;

	const match = url.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/);
	if (!match) return null;

	const issueId = match[1];

	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': cred.token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `query { issue(id: "${issueId}") { title description } }`
			})
		});

		if (!response.ok) return null;

		const data = await response.json();
		const issue = data?.data?.issue;
		if (!issue) return null;

		return {
			title: `${issueId}: ${issue.title}`,
			description: issue.description?.slice(0, 200) || null,
			favicon: 'https://linear.app/favicon.ico'
		};
	} catch {
		return null;
	}
}

export async function fetchNotionMetadata(url: string): Promise<PageMetadata | null> {
	const cred = await getCredential('notion');
	if (!cred) return null;

	const match = url.match(/notion\.so\/(?:[^/]+\/)?([a-f0-9]{32})/);
	if (!match) return null;

	const pageId = match[1];
	const formattedId = `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;

	try {
		const response = await fetch(`https://api.notion.com/v1/pages/${formattedId}`, {
			headers: {
				'Authorization': `Bearer ${cred.token}`,
				'Notion-Version': '2022-06-28'
			}
		});

		if (!response.ok) return null;

		const data = await response.json();
		const title = data.properties?.title?.title?.[0]?.plain_text ||
			data.properties?.Name?.title?.[0]?.plain_text ||
			'Notion Page';

		return {
			title,
			description: null,
			favicon: 'https://www.notion.so/images/favicon.ico'
		};
	} catch {
		return null;
	}
}

export async function fetchGoogleDocsMetadata(url: string): Promise<PageMetadata | null> {
	const accessToken = await getValidAccessToken();
	if (!accessToken) return null;

	// Extract document ID from various Google URLs
	const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
	const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
	const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);

	let fileId: string | null = null;
	let type: 'doc' | 'sheet' | 'file' = 'file';

	if (docMatch) {
		fileId = docMatch[1];
		type = 'doc';
	} else if (sheetMatch) {
		fileId = sheetMatch[1];
		type = 'sheet';
	} else if (driveMatch) {
		fileId = driveMatch[1];
	}

	if (!fileId) return null;

	try {
		const response = await fetch(
			`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,description`,
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`
				}
			}
		);

		if (!response.ok) return null;

		const data = await response.json();
		const prefix = type === 'doc' ? '📄' : type === 'sheet' ? '📊' : '📁';

		return {
			title: `${prefix} ${data.name}`,
			description: data.description || null,
			favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'
		};
	} catch {
		return null;
	}
}

export function getServiceForUrl(url: string): 'github' | 'linear' | 'notion' | 'google' | null {
	if (url.includes('github.com')) return 'github';
	if (url.includes('linear.app')) return 'linear';
	if (url.includes('notion.so')) return 'notion';
	if (url.includes('docs.google.com') || url.includes('drive.google.com')) return 'google';
	return null;
}

export async function fetchServiceMetadata(url: string): Promise<PageMetadata | null> {
	const service = getServiceForUrl(url);
	
	switch (service) {
		case 'github':
			return fetchGitHubMetadata(url);
		case 'linear':
			return fetchLinearMetadata(url);
		case 'notion':
			return fetchNotionMetadata(url);
		case 'google':
			return fetchGoogleDocsMetadata(url);
		default:
			return null;
	}
}
