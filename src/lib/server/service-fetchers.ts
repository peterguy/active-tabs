import { getCredential } from './credentials';
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

	// Match URLs like linear.app/workspace/issue/ENG-123 or linear.app/workspace/issue/ENG-123/title-slug
	const match = url.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i);
	if (!match) return null;

	const issueIdentifier = match[1].toUpperCase();

	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': cred.token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `
					query GetIssue($id: String!) {
						issue(id: $id) {
							identifier
							title
							description
							state {
								name
							}
						}
					}
				`,
				variables: { id: issueIdentifier }
			})
		});

		if (!response.ok) {
			console.error('Linear API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		
		if (data.errors) {
			console.error('Linear GraphQL errors:', data.errors);
			return null;
		}

		const issue = data?.data?.issue;
		if (!issue) return null;

		const status = issue.state?.name ? ` [${issue.state.name}]` : '';
		
		return {
			title: `${issue.identifier}: ${issue.title}${status}`,
			description: issue.description?.slice(0, 200) || null,
			favicon: 'https://linear.app/favicon.ico'
		};
	} catch (error) {
		console.error('Linear fetch error:', error);
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

export function getServiceForUrl(url: string): 'github' | 'linear' | 'notion' | null {
	if (url.includes('github.com')) return 'github';
	if (url.includes('linear.app')) return 'linear';
	if (url.includes('notion.so')) return 'notion';
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
		default:
			return null;
	}
}
