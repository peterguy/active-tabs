import { db } from '$lib/server/db';
import { tags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allTags = await db.select().from(tags).orderBy(tags.name);
	return { tags: allTags };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString() || '#3b82f6';

		if (!name) {
			return fail(400, { error: 'Tag name is required' });
		}

		const existing = await db.query.tags.findFirst({
			where: eq(tags.name, name)
		});

		if (existing) {
			return fail(400, { error: 'Tag already exists' });
		}

		await db.insert(tags).values({
			id: randomUUID(),
			name,
			color,
			createdAt: new Date()
		});

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString().trim();
		const color = formData.get('color')?.toString();

		if (!id || !name) {
			return fail(400, { error: 'Tag ID and name are required' });
		}

		await db
			.update(tags)
			.set({ name, color })
			.where(eq(tags.id, id));

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'Tag ID is required' });
		}

		await db.delete(tags).where(eq(tags.id, id));
		return { success: true };
	}
};
