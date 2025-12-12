import { fetchServiceMetadata, getServiceForUrl } from './service-fetchers';

export interface PageMetadata {
	title: string | null;
	description: string | null;
	favicon: string | null;
}

export async function fetchPageMetadata(url: string): Promise<PageMetadata> {
	// Try service-specific fetcher first if credentials are configured
	const service = getServiceForUrl(url);
	if (service) {
		const serviceMetadata = await fetchServiceMetadata(url);
		if (serviceMetadata && (serviceMetadata.title || serviceMetadata.description)) {
			return serviceMetadata;
		}
	}

	// Fall back to generic HTML scraping
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ActiveTabs/1.0)',
				'Accept': 'text/html,application/xhtml+xml'
			},
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) {
			return { title: null, description: null, favicon: null };
		}

		const html = await response.text();
		const baseUrl = new URL(url);

		return {
			title: extractTitle(html),
			description: extractDescription(html),
			favicon: extractFavicon(html, baseUrl)
		};
	} catch (error) {
		console.error(`Failed to fetch metadata for ${url}:`, error);
		return { title: null, description: null, favicon: null };
	}
}

function extractTitle(html: string): string | null {
	// Try og:title first
	const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
	if (ogTitle) return decodeHtmlEntities(ogTitle);

	// Try twitter:title
	const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
	if (twitterTitle) return decodeHtmlEntities(twitterTitle);

	// Try <title> tag
	const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
	if (titleTag) return decodeHtmlEntities(titleTag.trim());

	// Try first h1
	const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1];
	if (h1) return decodeHtmlEntities(h1.trim());

	return null;
}

function extractDescription(html: string): string | null {
	// Try og:description first
	const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
	if (ogDesc) return decodeHtmlEntities(ogDesc);

	// Try twitter:description
	const twitterDesc = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
	if (twitterDesc) return decodeHtmlEntities(twitterDesc);

	// Try meta description
	const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
	if (metaDesc) return decodeHtmlEntities(metaDesc);

	return null;
}

function extractFavicon(html: string, baseUrl: URL): string | null {
	// Try apple-touch-icon first (usually higher quality)
	const appleIcon = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)?.[1];
	if (appleIcon) return resolveUrl(appleIcon, baseUrl);

	// Try icon with sizes (prefer larger)
	const iconWithSize = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i)?.[1];
	if (iconWithSize) return resolveUrl(iconWithSize, baseUrl);

	// Try shortcut icon
	const shortcutIcon = html.match(/<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i)?.[1];
	if (shortcutIcon) return resolveUrl(shortcutIcon, baseUrl);

	// Default to /favicon.ico
	return `${baseUrl.origin}/favicon.ico`;
}

function resolveUrl(path: string, baseUrl: URL): string {
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}
	if (path.startsWith('//')) {
		return `${baseUrl.protocol}${path}`;
	}
	if (path.startsWith('/')) {
		return `${baseUrl.origin}${path}`;
	}
	return `${baseUrl.origin}/${path}`;
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}
