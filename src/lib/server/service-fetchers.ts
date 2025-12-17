import { getCredential } from './credentials';
import { getValidAccessToken } from './google-oauth';
import { fetchNotionPageViaMCP } from './mcp-notion';
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

	const issueMatch = url.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i);
	if (issueMatch) {
		return fetchLinearIssue(cred.token, issueMatch[1].toUpperCase());
	}

	const projectMatch = url.match(/linear\.app\/[^/]+\/project\/([a-z0-9-]+)/i);
	if (projectMatch) {
		return fetchLinearProject(cred.token, projectMatch[1]);
	}

	return null;
}

async function fetchLinearIssue(token: string, identifier: string): Promise<PageMetadata | null> {
	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `
					query GetIssue($id: String!) {
						issue(id: $id) {
							identifier
							title
							description
							state { name }
						}
					}
				`,
				variables: { id: identifier }
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

async function fetchLinearProject(token: string, slugId: string): Promise<PageMetadata | null> {
	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `
					query GetProject($slugId: String!) {
						project(id: $slugId) {
							name
							description
							state
						}
					}
				`,
				variables: { slugId }
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

		const project = data?.data?.project;
		if (!project) return null;

		const status = project.state ? ` [${project.state}]` : '';
		return {
			title: `${project.name}${status}`,
			description: project.description?.slice(0, 200) || null,
			favicon: 'https://linear.app/favicon.ico'
		};
	} catch (error) {
		console.error('Linear fetch error:', error);
		return null;
	}
}

export async function fetchSlackMetadata(url: string): Promise<PageMetadata | null> {
	const cred = await getCredential('slack');
	if (!cred) return null;

	// Match URLs like slack.com/archives/C12345678/p1234567890123456
	// or app.slack.com/client/T.../C.../p...
	const archiveMatch = url.match(/slack\.com\/archives\/([A-Z0-9]+)(?:\/p(\d+))?/i);
	if (!archiveMatch) return null;

	const channelId = archiveMatch[1];
	const messageTs = archiveMatch[2]
		? `${archiveMatch[2].slice(0, 10)}.${archiveMatch[2].slice(10)}`
		: null;

	try {
		// First get channel info
		const channelRes = await fetch(
			`https://slack.com/api/conversations.info?channel=${channelId}`,
			{
				headers: { Authorization: `Bearer ${cred.token}` }
			}
		);
		const channelData = await channelRes.json();

		if (!channelData.ok) {
			console.error('Slack API error:', channelData.error);
			return null;
		}

		const channelName = channelData.channel?.name || channelId;

		// If we have a message timestamp, fetch that specific message
		if (messageTs) {
			const historyRes = await fetch(
				`https://slack.com/api/conversations.history?channel=${channelId}&oldest=${messageTs}&inclusive=true&limit=1`,
				{
					headers: { Authorization: `Bearer ${cred.token}` }
				}
			);
			const historyData = await historyRes.json();

			if (!historyData.ok) {
				console.error('Slack history API error:', historyData.error);
			} else if (historyData.messages?.[0]) {
				const msg = historyData.messages[0];
				const text = msg.text?.slice(0, 100) || '';
				return {
					title: `#${channelName}: "${text}${text.length >= 100 ? '...' : ''}"`,
					description: msg.text?.slice(0, 200) || null,
					favicon: 'https://a.slack-edge.com/cebaa/img/ico/favicon.ico'
				};
			}
		}

		// Just return channel info
		return {
			title: `#${channelName}`,
			description: channelData.channel?.purpose?.value || channelData.channel?.topic?.value || null,
			favicon: 'https://a.slack-edge.com/cebaa/img/ico/favicon.ico'
		};
	} catch (error) {
		console.error('Slack fetch error:', error);
		return null;
	}
}

export async function fetchNotionMetadata(url: string): Promise<PageMetadata | null> {
	// Use MCP OAuth approach (lazy-connects if tokens exist)
	console.log('Notion: Fetching via MCP...');
	try {
		const mcpResult = await fetchNotionPageViaMCP(url);
		if (mcpResult) {
			console.log('Notion: MCP fetch succeeded:', mcpResult.title);
			return {
				title: mcpResult.title,
				description: mcpResult.description || null,
				favicon: 'https://www.notion.so/images/favicon.ico'
			};
		}
		console.log('Notion: MCP fetch returned null (not connected or page not accessible)');
	} catch (error) {
		console.error('Notion: MCP fetch failed:', error);
	}
	return null;
}

export async function fetchGoogleMetadata(url: string): Promise<PageMetadata | null> {
	const accessToken = await getValidAccessToken();
	if (!accessToken) return null;

	// Match Google Docs URLs
	const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
	if (docsMatch) {
		return fetchGoogleDoc(accessToken, docsMatch[1]);
	}

	// Match Google Sheets URLs
	const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
	if (sheetsMatch) {
		return fetchGoogleSheet(accessToken, sheetsMatch[1]);
	}

	return null;
}

async function fetchGoogleDoc(accessToken: string, docId: string): Promise<PageMetadata | null> {
	try {
		const response = await fetch(
			`https://docs.googleapis.com/v1/documents/${docId}?fields=title`,
			{
				headers: { Authorization: `Bearer ${accessToken}` }
			}
		);

		if (!response.ok) {
			console.error('Google Docs API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		return {
			title: data.title || 'Google Doc',
			description: null,
			favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'
		};
	} catch (error) {
		console.error('Google Docs fetch error:', error);
		return null;
	}
}

async function fetchGoogleSheet(accessToken: string, sheetId: string): Promise<PageMetadata | null> {
	try {
		const response = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`,
			{
				headers: { Authorization: `Bearer ${accessToken}` }
			}
		);

		if (!response.ok) {
			console.error('Google Sheets API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		return {
			title: data.properties?.title || 'Google Sheet',
			description: null,
			favicon: 'https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico'
		};
	} catch (error) {
		console.error('Google Sheets fetch error:', error);
		return null;
	}
}

export function getServiceForUrl(url: string): 'github' | 'linear' | 'slack' | 'notion' | 'google' | null {
	if (url.includes('github.com')) return 'github';
	if (url.includes('linear.app')) return 'linear';
	if (url.includes('slack.com')) return 'slack';
	if (url.includes('notion.so')) return 'notion';
	if (url.includes('docs.google.com')) return 'google';
	return null;
}

export async function fetchServiceMetadata(url: string): Promise<PageMetadata | null> {
	const service = getServiceForUrl(url);

	switch (service) {
		case 'github':
			return fetchGitHubMetadata(url);
		case 'linear':
			return fetchLinearMetadata(url);
		case 'slack':
			return fetchSlackMetadata(url);
		case 'notion':
			return fetchNotionMetadata(url);
		case 'google':
			return fetchGoogleMetadata(url);
		default:
			return null;
	}
}

/**
 * Fetch full content for summarization from service-specific APIs.
 * Returns the text content that can be sent to an LLM for summarization.
 */
export async function fetchServiceContent(url: string): Promise<string | null> {
	const service = getServiceForUrl(url);

	switch (service) {
		case 'notion':
			return fetchNotionContent(url);
		case 'github':
			return fetchGitHubContent(url);
		case 'linear':
			return fetchLinearContent(url);
		default:
			return null;
	}
}

async function fetchNotionContent(url: string): Promise<string | null> {
	try {
		const result = await fetchNotionPageViaMCP(url);
		if (result?.content) {
			return result.content;
		}
		// Fall back to description if no full content
		if (result?.description) {
			return `Title: ${result.title}\n\n${result.description}`;
		}
	} catch (error) {
		console.error('Failed to fetch Notion content:', error);
	}
	return null;
}

async function fetchGitHubContent(url: string): Promise<string | null> {
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
		const prefix = type === 'pull' ? 'Pull Request' : 'Issue';
		
		return `${prefix} #${number}: ${data.title}\n\nState: ${data.state}\n\n${data.body || ''}`;
	} catch {
		return null;
	}
}

async function fetchLinearContent(url: string): Promise<string | null> {
	console.log('fetchLinearContent: Starting for URL:', url);
	
	const cred = await getCredential('linear');
	if (!cred) {
		console.log('fetchLinearContent: No Linear credentials found');
		return null;
	}

	// Try issue pattern first
	const issueMatch = url.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i);
	if (issueMatch) {
		const identifier = issueMatch[1].toUpperCase();
		console.log('fetchLinearContent: Extracted issue identifier:', identifier);
		return fetchLinearIssueContent(cred.token, identifier);
	}
	
	// Try project pattern
	const projectMatch = url.match(/linear\.app\/[^/]+\/project\/([a-z0-9-]+)/i);
	if (projectMatch) {
		const slugId = projectMatch[1];
		console.log('fetchLinearContent: Extracted project slug:', slugId);
		return fetchLinearProjectContent(cred.token, slugId);
	}
	
	console.log('fetchLinearContent: URL did not match any known pattern');
	return null;
}

async function fetchLinearIssueContent(token: string, identifier: string): Promise<string | null> {
	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `
					query GetIssue($id: String!) {
						issue(id: $id) {
							identifier
							title
							description
							state { name }
							priority
							comments { nodes { body } }
						}
					}
				`,
				variables: { id: identifier }
			})
		});

		if (!response.ok) {
			console.error('Linear content fetch error:', response.status);
			return null;
		}

		const data = await response.json();
		console.log('fetchLinearContent: Raw response:', JSON.stringify(data).slice(0, 500));
		
		if (data.errors) {
			console.error('Linear GraphQL errors:', data.errors);
			return null;
		}
		
		const issue = data.data?.issue;
		if (!issue) {
			console.log('fetchLinearContent: No issue in response');
			return null;
		}

		let content = `Linear Issue ${issue.identifier}: ${issue.title}\n\nState: ${issue.state?.name || 'Unknown'}\nPriority: ${issue.priority || 'None'}\n\n${issue.description || '(No description)'}`;
		
		// Include comments for more context
		const comments = issue.comments?.nodes || [];
		if (comments.length > 0) {
			content += '\n\n--- Comments ---\n';
			for (const comment of comments.slice(0, 5)) {
				if (comment.body) {
					content += `\n${comment.body.slice(0, 300)}\n`;
				}
			}
		}
		
		return content;
	} catch (error) {
		console.error('Linear issue content fetch error:', error);
		return null;
	}
}

async function fetchLinearProjectContent(token: string, slugId: string): Promise<string | null> {
	try {
		const response = await fetch('https://api.linear.app/graphql', {
			method: 'POST',
			headers: {
				'Authorization': token,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				query: `
					query GetProject($slugId: String!) {
						project(id: $slugId) {
							name
							description
							state
							progress
							projectUpdates(first: 5) {
								nodes {
									body
									createdAt
								}
							}
						}
					}
				`,
				variables: { slugId }
			})
		});

		if (!response.ok) {
			console.error('Linear project content fetch error:', response.status);
			return null;
		}

		const data = await response.json();
		console.log('fetchLinearProjectContent: Raw response:', JSON.stringify(data).slice(0, 500));
		
		if (data.errors) {
			console.error('Linear GraphQL errors:', data.errors);
			return null;
		}
		
		const project = data.data?.project;
		if (!project) {
			console.log('fetchLinearProjectContent: No project in response');
			return null;
		}

		let content = `Linear Project: ${project.name}\n\nState: ${project.state || 'Unknown'}\nProgress: ${Math.round((project.progress || 0) * 100)}%\n\n${project.description || '(No description)'}`;
		
		// Include recent updates
		const updates = project.projectUpdates?.nodes || [];
		if (updates.length > 0) {
			content += '\n\n--- Recent Updates ---\n';
			for (const update of updates) {
				if (update.body) {
					content += `\n${update.body.slice(0, 500)}\n`;
				}
			}
		}
		
		return content;
	} catch (error) {
		console.error('Linear project content fetch error:', error);
		return null;
	}
}
