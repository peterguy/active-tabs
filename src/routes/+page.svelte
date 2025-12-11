<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let links = $state(structuredClone(data.links));

	async function trackClick(linkId: string) {
		await fetch(`/api/links/${linkId}/click`, { method: 'POST' });
	}

	async function togglePin(linkId: string, currentPinned: boolean) {
		const newPinned = !currentPinned;
		await fetch(`/api/links/${linkId}/pin`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ pinned: newPinned })
		});
		
		links = links.map(l => 
			l.id === linkId ? { ...l, pinned: newPinned } : l
		).sort((a, b) => {
			if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
			return 0;
		});
	}

	function formatRelativeTime(date: Date | null): string {
		if (!date) return 'never';
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<svelte:head>
	<title>Active Tabs</title>
</svelte:head>

<main class="max-w-4xl mx-auto p-6">
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-[var(--color-text)]">Active Tabs</h1>
		<p class="text-[var(--color-text-muted)] mt-2">Your links, organized and summarized.</p>
	</header>

	<section class="mb-6">
		<a
			href="/links/new"
			class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors"
		>
			<span class="text-xl">+</span>
			Add Link
		</a>
	</section>

	{#if links.length === 0}
		<div class="text-center py-16 text-[var(--color-text-muted)]">
			<p class="text-lg">No links yet.</p>
			<p class="mt-2">Add your first link to get started!</p>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each links as link (link.id)}
				<li
					class="group flex items-start gap-4 p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border)] transition-colors"
				>
					<div class="flex-1 min-w-0">
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-[var(--color-primary)] hover:underline font-medium block truncate"
							onclick={() => trackClick(link.id)}
						>
							{link.title || link.url}
						</a>
						{#if link.description}
							<p class="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
								{link.description}
							</p>
						{/if}
						<p class="text-xs text-[var(--color-text-muted)] mt-2">
							{link.clickCount} click{link.clickCount === 1 ? '' : 's'}
							{#if link.lastClickedAt}
								· last used {formatRelativeTime(link.lastClickedAt)}
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => togglePin(link.id, link.pinned)}
							class="text-lg hover:scale-110 transition-transform {link.pinned ? 'text-yellow-500' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'}"
							title={link.pinned ? 'Unpin' : 'Pin'}
						>
							📌
						</button>
						<a
							href="/links/{link.id}/edit"
							class="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity"
							title="Edit"
						>
							✏️
						</a>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</main>
