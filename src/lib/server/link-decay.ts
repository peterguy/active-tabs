import { db } from './db';
import { links } from './db/schema';
import { eq, isNull, and, not } from 'drizzle-orm';

const DECAY_THRESHOLD_DAYS = 7;
const MANUAL_SORT_PROTECTION_DAYS = 30;

export async function runLinkDecay(): Promise<{ processed: number; decayed: number }> {
	const now = new Date();
	const decayThreshold = new Date(now.getTime() - DECAY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
	const manualSortThreshold = new Date(now.getTime() - MANUAL_SORT_PROTECTION_DAYS * 24 * 60 * 60 * 1000);

	// Get all non-pinned links
	const allLinks = await db
		.select()
		.from(links)
		.where(eq(links.pinned, false))
		.orderBy(links.sortOrder);

	if (allLinks.length === 0) {
		return { processed: 0, decayed: 0 };
	}

	// Separate links into categories:
	// 1. Recently manually sorted - protected, keep in place
	// 2. Active (clicked within threshold) - should rise/maintain
	// 3. Stale (not clicked within threshold) - should sink

	const categorized = allLinks.map(link => {
		const isManuallyProtected = link.lastManualSort && link.lastManualSort > manualSortThreshold;
		const isActive = link.lastClickedAt && link.lastClickedAt > decayThreshold;
		const isNeverClicked = !link.lastClickedAt;
		
		return {
			...link,
			isManuallyProtected,
			isActive,
			isStale: !isActive && !isNeverClicked,
			isNeverClicked
		};
	});

	// Calculate new sort order:
	// - Protected links keep their exact position
	// - Active links get lower sort orders (rise to top)
	// - Stale links get higher sort orders (sink to bottom)
	// - Never-clicked links treated as slightly stale (sink slowly)

	const protectedLinks = categorized.filter(l => l.isManuallyProtected);
	const activeLinks = categorized.filter(l => !l.isManuallyProtected && l.isActive);
	const staleLinks = categorized.filter(l => !l.isManuallyProtected && l.isStale);
	const neverClickedLinks = categorized.filter(l => !l.isManuallyProtected && l.isNeverClicked);

	// Sort active links by most recently clicked first
	activeLinks.sort((a, b) => {
		const aTime = a.lastClickedAt?.getTime() || 0;
		const bTime = b.lastClickedAt?.getTime() || 0;
		return bTime - aTime;
	});

	// Sort stale links by least recently clicked first (oldest sink most)
	staleLinks.sort((a, b) => {
		const aTime = a.lastClickedAt?.getTime() || 0;
		const bTime = b.lastClickedAt?.getTime() || 0;
		return aTime - bTime;
	});

	// Sort never-clicked by creation date (newer on top of never-clicked group)
	neverClickedLinks.sort((a, b) => {
		const aTime = a.createdAt.getTime();
		const bTime = b.createdAt.getTime();
		return bTime - aTime;
	});

	// Build new order: active first, then never-clicked, then stale
	// But insert protected links at their original positions
	const unprotectedOrder = [...activeLinks, ...neverClickedLinks, ...staleLinks];
	
	// Create a map of protected link positions
	const protectedPositions = new Map<number, typeof protectedLinks[0]>();
	for (const link of protectedLinks) {
		protectedPositions.set(link.sortOrder, link);
	}

	// Merge protected and unprotected, keeping protected at their original sortOrder
	const finalOrder: typeof allLinks = [];
	let unprotectedIndex = 0;
	
	for (let position = 0; position < allLinks.length; position++) {
		const protectedLink = protectedPositions.get(position);
		if (protectedLink) {
			finalOrder.push(protectedLink);
		} else if (unprotectedIndex < unprotectedOrder.length) {
			finalOrder.push(unprotectedOrder[unprotectedIndex]);
			unprotectedIndex++;
		}
	}

	// Add any remaining unprotected links
	while (unprotectedIndex < unprotectedOrder.length) {
		finalOrder.push(unprotectedOrder[unprotectedIndex]);
		unprotectedIndex++;
	}

	// Update sort orders in database
	let decayedCount = 0;
	for (let i = 0; i < finalOrder.length; i++) {
		const link = finalOrder[i];
		if (link.sortOrder !== i) {
			await db
				.update(links)
				.set({ sortOrder: i })
				.where(eq(links.id, link.id));
			decayedCount++;
		}
	}

	return { processed: allLinks.length, decayed: decayedCount };
}
