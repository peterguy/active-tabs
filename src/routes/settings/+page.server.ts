import { listCredentials, saveCredential, deleteCredential, SUPPORTED_SERVICES, type ServiceType } from '$lib/server/credentials';
import { getGoogleOAuthConfig, saveGoogleOAuthConfig, isGoogleConnected, disconnectGoogle } from '$lib/server/google-oauth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const configured = await listCredentials();
	const configuredMap = new Map(configured.map(c => [c.service, c]));

	const googleConfig = await getGoogleOAuthConfig();
	const googleConnected = await isGoogleConnected();

	const services = SUPPORTED_SERVICES.map(s => {
		if (s.id === 'google') {
			return {
				...s,
				isConfigured: googleConnected,
				hasOAuthConfig: googleConfig !== null,
				credential: configuredMap.get(s.id) || null,
				requiresOAuth: true
			};
		}
		return {
			...s,
			isConfigured: configuredMap.has(s.id),
			hasOAuthConfig: false,
			credential: configuredMap.get(s.id) || null,
			requiresOAuth: false
		};
	});

	const error = url.searchParams.get('error');
	const success = url.searchParams.get('success');

	return { services, error, success };
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
