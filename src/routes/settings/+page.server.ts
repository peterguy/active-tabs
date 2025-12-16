import { listCredentials, saveCredential, deleteCredential, SUPPORTED_SERVICES, type ServiceType } from '$lib/server/credentials';
import { isGoogleConfigured, isGoogleConnected, saveGoogleOAuthConfig, disconnectGoogle } from '$lib/server/google-oauth';
import { getMCPStatus } from '$lib/server/mcp-notion';
import { isOllamaAvailable, listModels } from '$lib/server/ollama';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const configured = await listCredentials();
	const configuredMap = new Map(configured.map(c => [c.service, c]));

	const googleConfigured = await isGoogleConfigured();
	const googleConnected = await isGoogleConnected();
	const notionMCPStatus = await getMCPStatus();

	const services = SUPPORTED_SERVICES.map(s => {
		if (s.id === 'google') {
			return { ...s, isConfigured: googleConnected, isOAuthConfigured: googleConfigured, credential: configuredMap.get(s.id) || null };
		}
		return { ...s, isConfigured: configuredMap.has(s.id), isOAuthConfigured: false, credential: configuredMap.get(s.id) || null };
	});

	const ollamaAvailable = await isOllamaAvailable();
	const ollamaModels = ollamaAvailable ? await listModels() : [];

	return {
		services,
		notionMCP: {
			// Show as connected if we have tokens (client will lazy-connect on first use)
			connected: notionMCPStatus.hasTokens,
			hasTokens: notionMCPStatus.hasTokens,
			hasClientInfo: notionMCPStatus.hasClientInfo
		},
		ollama: {
			available: ollamaAvailable,
			models: ollamaModels
		},
		success: url.searchParams.get('success'),
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		const service = formData.get('service')?.toString() as ServiceType;
		const token = formData.get('token')?.toString().trim();

		if (!service || !token) {
			return fail(400, { error: 'Service and token are required' });
		}

		if (!SUPPORTED_SERVICES.find(s => s.id === service)) {
			return fail(400, { error: 'Invalid service' });
		}

		await saveCredential(service, 'pat', { token });

		return { success: true, service };
	},

	saveGoogleConfig: async ({ request }) => {
		const formData = await request.formData();
		const clientId = formData.get('clientId')?.toString().trim();
		const clientSecret = formData.get('clientSecret')?.toString().trim();

		if (!clientId || !clientSecret) {
			return fail(400, { error: 'Client ID and Client Secret are required' });
		}

		await saveGoogleOAuthConfig({ clientId, clientSecret });

		return { success: true, service: 'google', configSaved: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const service = formData.get('service')?.toString() as ServiceType;

		if (!service) {
			return fail(400, { error: 'Service is required' });
		}

		if (service === 'google') {
			await disconnectGoogle();
		} else {
			await deleteCredential(service);
		}

		return { success: true, deleted: service };
	}
};
