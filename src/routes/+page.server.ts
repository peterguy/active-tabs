import { db } from '$lib/server/db';
import { links, tags, linkTags } from '$lib/server/db/schema';
import { desc, eq, like, or, inArray } from 'drizzle-orm';
import { runLinkDecay } from '$lib/server/link-decay';
import type { PageServerLoad } from './$types';

let lastDecayRun = 0;
const DECAY_INTERVAL_MS = 60 * 60 * 1000; // Run decay at most once per hour

export const load: PageServerLoad = async ({ url }) => {
	// Run decay periodically (not on every page load)
	const now = Date.now();
	if (now - lastDecayRun > DECAY_INTERVAL_MS) {
		lastDecayRun = now;
		runLinkDecay().catch(err => console.error('Link decay failed:', err));
	}
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
