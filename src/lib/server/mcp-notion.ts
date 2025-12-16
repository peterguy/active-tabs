/**
 * MCP-based Notion client for fetching page metadata.
 * 
 * Uses the official MCP SDK to connect to Notion's MCP server at https://mcp.notion.com/mcp
 * This gives us broader access than internal integration tokens since it uses Notion's
 * OAuth flow with user-level permissions.
 * 
 * The OAuth flow works as follows:
 * 1. User visits /api/auth/notion-mcp/connect
 * 2. We initialize the MCP client, which triggers OAuth if needed
 * 3. User is redirected to Notion's OAuth page
 * 4. After authorization, user is redirected back to /api/auth/notion-mcp/callback
 * 5. We complete the OAuth flow and the client is ready
 * 
 * State (OAuth tokens, client info) is persisted in memory during the server's lifetime.
 * For production, you'd want to persist this to the database.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthClientInformationMixed, OAuthClientMetadata, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import { saveCredential, getCredential, deleteCredential } from './credentials';

const NOTION_MCP_URL = 'https://mcp.notion.com/mcp';
const CALLBACK_PATH = '/api/auth/notion-mcp/callback';
const MCP_SERVICE_KEY = 'notion-mcp' as const;

/**
 * In-memory OAuth state for the current session
 * Tokens are also persisted to DB for survival across restarts
 */
interface MCPOAuthState {
	clientInfo?: OAuthClientInformationMixed;
	tokens?: OAuthTokens;
	codeVerifier?: string;
	redirectUrl?: string;
}

const oauthState: MCPOAuthState = {};
let mcpClient: Client | null = null;
let mcpTransport: StreamableHTTPClientTransport | null = null;

// Store pending auth URL separately to avoid TypeScript control flow issues
let _pendingAuthUrl: URL | null = null;
function getPendingAuthUrl(): URL | null { return _pendingAuthUrl; }
function setPendingAuthUrl(url: URL | null): void { _pendingAuthUrl = url; }

/**
 * Load MCP OAuth state from database
 */
async function loadPersistedState(): Promise<void> {
	try {
		// @ts-expect-error - extending ServiceType temporarily
		const cred = await getCredential(MCP_SERVICE_KEY);
		if (cred) {
			const data = JSON.parse(cred.token);
			console.log('MCP: Parsed persisted data, has tokens:', !!data.tokens, 'has clientInfo:', !!data.clientInfo);
			if (data.tokens) oauthState.tokens = data.tokens;
			if (data.clientInfo) oauthState.clientInfo = data.clientInfo;
			console.log('MCP: Loaded persisted OAuth state');
		} else {
			console.log('MCP: No persisted state found');
		}
	} catch (error) {
		console.error('MCP: Failed to load persisted state:', error);
	}
}

/**
 * Save MCP OAuth state to database
 */
async function persistState(): Promise<void> {
	try {
		const data = JSON.stringify({
			tokens: oauthState.tokens,
			clientInfo: oauthState.clientInfo
		});
		// @ts-expect-error - extending ServiceType temporarily
		await saveCredential(MCP_SERVICE_KEY, 'oauth', { token: data });
		console.log('MCP: Persisted OAuth state to database');
	} catch (error) {
		console.error('MCP: Failed to persist state:', error);
	}
}

/**
 * OAuth provider that stores tokens in our persistent state
 */
class NotionMCPOAuthProvider implements OAuthClientProvider {
	private _redirectUrl: string;
	private onRedirect: (url: URL) => void;

	constructor(redirectUrl: string, onRedirect: (url: URL) => void) {
		this._redirectUrl = redirectUrl;
		this.onRedirect = onRedirect;
		oauthState.redirectUrl = redirectUrl;
	}

	get redirectUrl(): string {
		return this._redirectUrl;
	}

	get clientMetadata(): OAuthClientMetadata {
		return {
			client_name: 'Active Tabs - Notion Integration',
			redirect_uris: [this.redirectUrl],
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			token_endpoint_auth_method: 'client_secret_post'
		};
	}

	async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
		return oauthState.clientInfo;
	}

	async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
		oauthState.clientInfo = info;
		console.log('MCP: Saved client info');
		await persistState();
	}

	async tokens(): Promise<OAuthTokens | undefined> {
		return oauthState.tokens;
	}

	async saveTokens(tokens: OAuthTokens): Promise<void> {
		oauthState.tokens = tokens;
		console.log('MCP: Saved OAuth tokens');
		await persistState();
	}

	async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
		console.log('MCP OAuth: redirecting to', authorizationUrl.toString());
		this.onRedirect(authorizationUrl);
	}

	async saveCodeVerifier(verifier: string): Promise<void> {
		oauthState.codeVerifier = verifier;
	}

	async codeVerifier(): Promise<string> {
		return oauthState.codeVerifier || '';
	}
}

/**
 * Create an OAuth provider using stored state
 */
function createOAuthProvider(redirectUrl: string): NotionMCPOAuthProvider {
	return new NotionMCPOAuthProvider(redirectUrl, (url: URL) => {
		setPendingAuthUrl(url);
	});
}

/**
 * Initialize the MCP client and start the OAuth flow if needed.
 * Returns the authorization URL if OAuth is required.
 */
export async function initNotionMCP(baseUrl: string): Promise<{ needsAuth: boolean; authUrl?: string }> {
	const redirectUrl = `${baseUrl}${CALLBACK_PATH}`;
	
	// Load persisted state from database if we don't have tokens in memory
	if (!oauthState.tokens) {
		await loadPersistedState();
	}
	
	// If we have tokens (from memory or DB), try to reconnect
	if (oauthState.tokens && !mcpClient) {
		console.log('MCP: Found existing tokens, attempting reconnection...');
		const provider = createOAuthProvider(redirectUrl);
		
		mcpClient = new Client(
			{ name: 'active-tabs', version: '1.0.0' },
			{ capabilities: {} }
		);
		
		mcpTransport = new StreamableHTTPClientTransport(new URL(NOTION_MCP_URL), {
			authProvider: provider
		});
		
		try {
			await mcpClient.connect(mcpTransport);
			console.log('MCP: Reconnected with existing tokens');
			return { needsAuth: false };
		} catch (error) {
			console.log('MCP: Reconnection failed, will need fresh auth:', error);
			mcpClient = null;
			mcpTransport = null;
		}
	}
	
	// If already connected WITH tokens, we're done
	if (mcpClient && mcpTransport && oauthState.tokens) {
		console.log('MCP: Already connected with valid tokens');
		return { needsAuth: false };
	}
	
	// If we have a client but no tokens, we need to re-auth
	if (mcpClient && !oauthState.tokens) {
		console.log('MCP: Client exists but no tokens, clearing for re-auth');
		mcpClient = null;
		mcpTransport = null;
	}
	
	setPendingAuthUrl(null);
	const provider = createOAuthProvider(redirectUrl);

	mcpClient = new Client(
		{ name: 'active-tabs', version: '1.0.0' },
		{ capabilities: {} }
	);

	mcpTransport = new StreamableHTTPClientTransport(new URL(NOTION_MCP_URL), {
		authProvider: provider
	});

	try {
		await mcpClient.connect(mcpTransport);
		console.log('MCP: Connected successfully');
		return { needsAuth: false };
	} catch (error: unknown) {
		// Check if it's an UnauthorizedError that triggered OAuth redirect
		const pendingUrl = getPendingAuthUrl();
		if (pendingUrl) {
			console.log('MCP: OAuth required, auth URL:', pendingUrl.toString());
			return { needsAuth: true, authUrl: pendingUrl.toString() };
		}
		console.error('MCP: Connection failed:', error);
		mcpClient = null;
		mcpTransport = null;
		throw error;
	}
}

/**
 * Complete the OAuth flow with the authorization code from the callback.
 * This requires the transport to still be in memory from the initNotionMCP call.
 */
export async function completeNotionMCPAuth(code: string): Promise<boolean> {
	if (!mcpTransport) {
		console.error('MCP: Transport not available for auth completion');
		return false;
	}

	try {
		console.log('MCP: Completing OAuth with code...');
		await mcpTransport.finishAuth(code);
		console.log('MCP: OAuth completed successfully');
		
		// Close old transport and create fresh client/transport for actual use
		// (can't reuse a transport that's already started)
		try {
			await mcpTransport.close();
		} catch {
			// Ignore close errors
		}
		mcpClient = null;
		mcpTransport = null;
		
		// Create fresh client with the now-saved tokens
		console.log('MCP: Creating fresh client after OAuth...');
		const redirectUrl = oauthState.redirectUrl || '';
		const provider = createOAuthProvider(redirectUrl);
		
		mcpClient = new Client(
			{ name: 'active-tabs', version: '1.0.0' },
			{ capabilities: {} }
		);
		
		mcpTransport = new StreamableHTTPClientTransport(new URL(NOTION_MCP_URL), {
			authProvider: provider
		});
		
		await mcpClient.connect(mcpTransport);
		console.log('MCP: Fresh client connected successfully');
		
		return true;
	} catch (error) {
		console.error('MCP: Failed to complete OAuth:', error);
		return false;
	}
}

/**
 * Ensure MCP client is connected (lazy init from persisted tokens)
 */
async function ensureMCPConnected(): Promise<boolean> {
	// Already connected with tokens
	if (mcpClient && mcpTransport && oauthState.tokens) {
		return true;
	}
	
	// Try to load persisted tokens and connect
	if (!oauthState.tokens) {
		await loadPersistedState();
	}
	
	if (oauthState.tokens && !mcpClient) {
		console.log('MCP: Lazy-connecting with persisted tokens...');
		const redirectUrl = oauthState.redirectUrl || '';
		const provider = createOAuthProvider(redirectUrl);
		
		mcpClient = new Client(
			{ name: 'active-tabs', version: '1.0.0' },
			{ capabilities: {} }
		);
		
		mcpTransport = new StreamableHTTPClientTransport(new URL(NOTION_MCP_URL), {
			authProvider: provider
		});
		
		try {
			await mcpClient.connect(mcpTransport);
			console.log('MCP: Lazy-connected successfully');
			return true;
		} catch (error) {
			console.error('MCP: Lazy-connect failed:', error);
			mcpClient = null;
			mcpTransport = null;
			return false;
		}
	}
	
	return false;
}

/**
 * Fetch a Notion page title and description using the MCP notion-fetch tool
 */
export async function fetchNotionPageViaMCP(pageIdOrUrl: string): Promise<{ title: string; description?: string; content?: string } | null> {
	// Ensure we're connected (lazy init if needed)
	if (!await ensureMCPConnected()) {
		console.log('MCP: Not connected and cannot lazy-connect');
		return null;
	}
	
	if (mcpClient && mcpTransport) {
		try {
			console.log('MCP: Fetching Notion page:', pageIdOrUrl);
			const result = await mcpClient.request(
				{
					method: 'tools/call',
					params: {
						name: 'notion-fetch',
						arguments: { id: pageIdOrUrl }
					}
				},
				CallToolResultSchema
			);

			// The result content should contain the page data
			for (const item of result.content) {
				if (item.type === 'text') {
					console.log('MCP: Raw response (first 500 chars):', item.text.slice(0, 500));
					
					// Try to parse the full JSON to get title and extract description from text
					try {
						const parsed = JSON.parse(item.text);
						if (parsed.title) {
							let description: string | undefined;
							
							// Extract description from the text content
							// Skip the XML-like tags, markdown headers, and find actual content
							if (parsed.text) {
								const lines = parsed.text.split('\n');
								const contentLines: string[] = [];
								
								for (const line of lines) {
									const trimmed = line.trim();
									// Skip empty lines
									if (!trimmed) continue;
									// Skip XML-like tags
									if (trimmed.startsWith('<') || trimmed.endsWith('>')) continue;
									// Skip JSON-like content
									if (trimmed.startsWith('{') || trimmed.startsWith('[')) continue;
									// Skip metadata lines
									if (trimmed.startsWith('Here is the result')) continue;
									if (trimmed.includes('{{') || trimmed.includes('}}')) continue;
									// Skip markdown headers
									if (trimmed.startsWith('#')) continue;
									// Skip horizontal rules
									if (trimmed === '---' || trimmed === '***') continue;
									// Skip bullet points that are just formatting
									if (trimmed === '-' || trimmed === '*') continue;
									
									// This looks like actual content
									contentLines.push(trimmed);
									
									// Get first ~200 chars of content
									const joined = contentLines.join(' ');
									if (joined.length >= 200) {
										description = joined.slice(0, 200) + '...';
										break;
									}
								}
								
								if (!description && contentLines.length > 0) {
									description = contentLines.join(' ').slice(0, 200);
								}
							}
							
							console.log('MCP: Extracted title:', parsed.title, 'description:', description?.slice(0, 50));
							return { title: parsed.title, description, content: parsed.text };
						}
					} catch {
						// Not valid JSON, fall through to regex parsing
					}
					
					// Fallback: Try regex for JSON metadata
					const jsonMatch = item.text.match(/^\{"metadata":.+?"title":"([^"]+)"/);
					if (jsonMatch) {
						console.log('MCP: Extracted title from JSON regex:', jsonMatch[1]);
						return { title: jsonMatch[1] };
					}
					
					// Try markdown header format "# Page Title\n..."
					const titleMatch = item.text.match(/^#\s+(.+)$/m);
					if (titleMatch) {
						return { title: titleMatch[1] };
					}
					
					// If no markdown header, try to extract from the first line
					const firstLine = item.text.split('\n')[0].trim();
					if (firstLine) {
						return { title: firstLine };
					}
				}
			}
			return null;
		} catch (error) {
			// If "Not connected", try to reconnect once
			if (error instanceof Error && error.message.includes('Not connected')) {
				console.log('MCP: Client disconnected, attempting reconnect...');
				try {
					await mcpClient.connect(mcpTransport);
					console.log('MCP: Reconnected, retrying fetch...');
					return fetchNotionPageViaMCP(pageIdOrUrl); // Retry once
				} catch (reconnectError) {
					console.error('MCP: Reconnect failed:', reconnectError);
					return null;
				}
			}
			console.error('MCP: notion-fetch failed:', error);
			return null;
		}
	}

	console.error('MCP: Client not initialized or no tokens');
	return null;
}

/**
 * List available MCP tools (for debugging)
 */
export async function listMCPTools(): Promise<string[]> {
	if (!mcpClient) {
		console.log('MCP: No client for listTools');
		return [];
	}
	try {
		console.log('MCP: Listing tools...');
		const result = await mcpClient.request(
			{ method: 'tools/list', params: {} },
			ListToolsResultSchema
		);
		console.log('MCP: Got tools:', result.tools.length);
		return result.tools.map(t => t.name);
	} catch (error) {
		console.error('MCP: Failed to list tools:', error);
		return [];
	}
}

/**
 * Check if MCP Notion is connected and ready
 */
export function isNotionMCPConnected(): boolean {
	return mcpClient !== null && oauthState.tokens !== undefined;
}

/**
 * Get current MCP OAuth state for debugging
 * This also loads persisted state to check for tokens in DB
 */
export async function getMCPStatus(): Promise<{ connected: boolean; hasTokens: boolean; hasClientInfo: boolean }> {
	// Load from DB if not in memory
	if (!oauthState.tokens && !oauthState.clientInfo) {
		await loadPersistedState();
	}
	
	return {
		connected: mcpClient !== null,
		hasTokens: oauthState.tokens !== undefined,
		hasClientInfo: oauthState.clientInfo !== undefined
	};
}

/**
 * Disconnect from Notion MCP
 */
export async function disconnectNotionMCP(): Promise<void> {
	if (mcpTransport) {
		try {
			await mcpTransport.close();
		} catch (error) {
			console.error('MCP: Error closing transport:', error);
		}
	}
	mcpClient = null;
	mcpTransport = null;
	// Clear OAuth state from memory and database
	delete oauthState.tokens;
	delete oauthState.clientInfo;
	delete oauthState.codeVerifier;
	setPendingAuthUrl(null);
	try {
		// @ts-expect-error - extending ServiceType temporarily
		await deleteCredential(MCP_SERVICE_KEY);
	} catch (error) {
		console.error('MCP: Failed to delete persisted state:', error);
	}
	console.log('MCP: Disconnected');
}
