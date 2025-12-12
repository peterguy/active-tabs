import { listCredentials, saveCredential, deleteCredential, SUPPORTED_SERVICES, type ServiceType } from '$lib/server/credentials';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const configured = await listCredentials();
	const configuredMap = new Map(configured.map(c => [c.service, c]));

	const services = SUPPORTED_SERVICES.map(s => ({
		...s,
		isConfigured: configuredMap.has(s.id),
		credential: configuredMap.get(s.id) || null
	}));

	return { services };
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

	delete: async ({ request }) => {
		const formData = await request.formData();
		const service = formData.get('service')?.toString() as ServiceType;

		if (!service) {
			return fail(400, { error: 'Service is required' });
		}

		await deleteCredential(service);

		return { success: true, deleted: service };
	}
};
