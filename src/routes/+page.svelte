<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let links = $state(structuredClone(data.links));
	let searchQuery = $state(data.search);

	$effect(() => {
		links = structuredClone(data.links);
	});

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

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (data.tagFilter) params.set('tag', data.tagFilter);
		goto(`/?${params.toString()}`, { keepFocus: true });
	}

	function clearFilters() {
		searchQuery = '';
		goto('/');
	}

	function filterByTag(tagId: string) {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (data.tagFilter === tagId) {
			goto(`/?${params.toString()}`);
		} else {
			params.set('tag', tagId);
			goto(`/?${params.toString()}`);
		}
	}
</script>

<svelte:head>
	<title>Active Tabs</title>
</svelte:head>

<main class="max-w-4xl mx-auto p-6">
	<header class="mb-6">
		<h1 class="text-3xl font-bold text-[var(--color-text)]">Active Tabs</h1>
		<p class="text-[var(--color-text-muted)] mt-2">Your links, organized and summarized.</p>
	</header>

	<div class="flex gap-3 mb-6">
		<form onsubmit={handleSearch} class="flex-1 flex gap-2">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search links..."
				class="flex-1 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
			/>
			<button
				type="submit"
				class="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
			>
				Search
			</button>
		</form>
		<a
			href="/links/new"
			class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors"
		>
			+ Add
		</a>
		<a
			href="/tags"
			class="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
		>
			Tags
		</a>
	</div>

	{#if data.tags.length > 0}
		<div class="flex flex-wrap gap-2 mb-6">
			{#each data.tags as tag (tag.id)}
				<button
					onclick={() => filterByTag(tag.id)}
					class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors {data.tagFilter === tag.id ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'}"
					style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}40"
				>
					<span class="w-2 h-2 rounded-full" style="background-color: {tag.color}"></span>
					{tag.name}
				</button>
			{/each}
		</div>
	{/if}

	{#if data.search || data.tagFilter}
		<div class="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
			<span>
				{links.length} result{links.length === 1 ? '' : 's'}
				{#if data.search}for "{data.search}"{/if}
				{#if data.tagFilter}
					{@const activeTag = data.tags.find(t => t.id === data.tagFilter)}
					{#if activeTag}in {activeTag.name}{/if}
				{/if}
			</span>
			<button onclick={clearFilters} class="text-[var(--color-primary)] hover:underline">
				Clear filters
			</button>
		</div>
	{/if}

	{#if links.length === 0}
		<div class="text-center py-16 text-[var(--color-text-muted)]">
			{#if data.search || data.tagFilter}
				<p class="text-lg">No matching links found.</p>
			{:else}
				<p class="text-lg">No links yet.</p>
				<p class="mt-2">Add your first link to get started!</p>
			{/if}
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
						<div class="flex items-center gap-3 mt-2">
							<p class="text-xs text-[var(--color-text-muted)]">
								{link.clickCount} click{link.clickCount === 1 ? '' : 's'}
								{#if link.lastClickedAt}
									· last used {formatRelativeTime(link.lastClickedAt)}
								{/if}
							</p>
							{#if link.tags && link.tags.length > 0}
								<div class="flex gap-1">
									{#each link.tags as tag (tag.id)}
										<span
											class="px-2 py-0.5 rounded-full text-xs"
											style="background-color: {tag.color}20; color: {tag.color}"
										>
											{tag.name}
										</span>
									{/each}
								</div>
							{/if}
						</div>
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
