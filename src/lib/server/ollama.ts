const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';
const TIMEOUT_MS = 60000;

export interface OllamaModel {
	name: string;
	size: number;
	modifiedAt: string;
}

export interface SummaryResult {
	summary: string;
	model: string;
}

export async function listModels(): Promise<OllamaModel[]> {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
			signal: AbortSignal.timeout(5000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		return (data.models || []).map((m: { name: string; size: number; modified_at: string }) => ({
			name: m.name,
			size: m.size,
			modifiedAt: m.modified_at
		}));
	} catch {
		return [];
	}
}

export async function isOllamaAvailable(): Promise<boolean> {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
			signal: AbortSignal.timeout(3000)
		});
		return response.ok;
	} catch {
		return false;
	}
}

export async function generateSummary(
	content: string,
	url: string,
	title: string | null,
	model?: string
): Promise<SummaryResult | null> {
	const selectedModel = model || DEFAULT_MODEL;

	const prompt = buildSummaryPrompt(content, url, title);

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: selectedModel,
				prompt,
				stream: false,
				options: {
					temperature: 0.3,
					num_predict: 256
				}
			}),
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});

		if (!response.ok) {
			console.error('Ollama API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		const rawSummary = data.response?.trim();

		if (!rawSummary) return null;

		const summary = cleanSummary(rawSummary);
		return { summary, model: selectedModel };
	} catch (error) {
		console.error('Ollama generate error:', error);
		return null;
	}
}

function buildSummaryPrompt(content: string, url: string, title: string | null): string {
	const truncatedContent = content.slice(0, 4000);

	return `Summarize the following content in 2-3 sentences. Be direct - start with the actual summary, no preamble like "Here is a summary" or "This page describes". Just state what the content is about.

${title ? `Title: ${title}\n` : ''}Content:
${truncatedContent}`;
}

/**
 * Strip common LLM preamble patterns from summaries
 */
function cleanSummary(summary: string): string {
	// Patterns to strip from the beginning
	const preamblePatterns = [
		/^here\s+is\s+(a\s+)?(the\s+)?\d*-?\s*sentence\s+summary[^:]*:\s*/i,
		/^here\s+is\s+(a\s+)?(the\s+)?summary[^:]*:\s*/i,
		/^summary[^:]*:\s*/i,
		/^this\s+(page|document|article|content)\s+(describes|is about|discusses|explains)[^.]*\.\s*/i,
		/^the\s+(page|document|article|content)\s+(describes|is about|discusses|explains)[^.]*\.\s*/i,
	];
	
	let cleaned = summary.trim();
	for (const pattern of preamblePatterns) {
		cleaned = cleaned.replace(pattern, '');
	}
	
	return cleaned.trim();
}

export async function fetchPageContent(url: string): Promise<string | null> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ActiveTabs/1.0)',
				Accept: 'text/html,application/xhtml+xml'
			},
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return null;

		const html = await response.text();
		return extractTextContent(html);
	} catch {
		return null;
	}
}

function extractTextContent(html: string): string {
	let text = html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
		.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
		.replace(/\s+/g, ' ')
		.trim();

	return text.slice(0, 8000);
}
