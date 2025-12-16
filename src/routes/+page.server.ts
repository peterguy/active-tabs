import { db } from '$lib/server/db';
import { links, tags, linkTags } from '$lib/server/db/schema';
import { desc, eq, like, or, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.trim() || '';
	const tagFilter = url.searchParams.get('tag') || '';

	let allLinks = await db.query.links.findMany({
		with: {
			linkTags: {
				with: {
					tag: true
				}
			}
		},
		orderBy: [
			desc(links.pinned),
			links.sortOrder,
			desc(links.createdAt)
		]
	});

	if (search) {
		const searchLower = search.toLowerCase();
		allLinks = allLinks.filter(link => 
			link.url.toLowerCase().includes(searchLower) ||
			link.title?.toLowerCase().includes(searchLower) ||
			link.description?.toLowerCase().includes(searchLower) ||
			link.linkTags.some(lt => lt.tag.name.toLowerCase().includes(searchLower))
		);
	}

	if (tagFilter) {
		allLinks = allLinks.filter(link =>
			link.linkTags.some(lt => lt.tag.id === tagFilter)
		);
	}

	const allTags = await db.select().from(tags).orderBy(tags.name);

	return {
		links: allLinks.map(link => ({
			...link,
			tags: link.linkTags.map(lt => lt.tag)
		})),
		tags: allTags,
		search,
		tagFilter
	};
};
