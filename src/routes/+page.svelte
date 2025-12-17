<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let links = $state(structuredClone(data.links));
	let searchQuery = $state(data.search);
	let animatingPinId: string | null = $state(null);
	let refreshingId: string | null = $state(null);
	let summarizingId: string | null = $state(null);
	let expandedSummaries: Set<string> = $state(new Set());
	let draggedId: string | null = $state(null);
	let dragOverId: string | null = $state(null);

	$effect(() => {
		links = structuredClone(data.links);
	});

	async function trackClick(linkId: string) {
		fetch(`/api/links/${linkId}/click`, { method: 'POST' });
		links = links.map(l =>
			l.id === linkId
				? { ...l, clickCount: l.clickCount + 1, lastClickedAt: new Date() }
				: l
		);
	}

	async function togglePin(linkId: string, currentPinned: boolean) {
		const newPinned = !currentPinned;
		
		animatingPinId = linkId;
		
		fetch(`/api/links/${linkId}/pin`, {
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

		setTimeout(() => {
			animatingPinId = null;
		}, 600);
	}

	async function refreshMetadata(linkId: string) {
		refreshingId = linkId;
		try {
			const res = await fetch(`/api/links/${linkId}/fetch-metadata`, { method: 'POST' });
			const result = await res.json();
			if (result.success && result.metadata) {
				links = links.map(l => {
					if (l.id === linkId) {
						const updated = {
							...l,
							title: result.metadata.title || l.title,
							description: result.metadata.description || l.description,
							favicon: result.metadata.favicon || l.favicon
						};
						// Include auto-generated summary if available
						if (result.summary) {
							updated.summary = result.summary;
							expandedSummaries = new Set([...expandedSummaries, linkId]);
						}
						return updated;
					}
					return l;
				});
			}
		} finally {
			refreshingId = null;
		}
	}

	async function summarize(linkId: string, force = false) {
		summarizingId = linkId;
		try {
			const res = await fetch(`/api/links/${linkId}/summarize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ force })
			});
			const result = await res.json();
			if (result.success && result.summary) {
				links = links.map(l =>
					l.id === linkId ? { ...l, summary: result.summary } : l
				);
				expandedSummaries = new Set([...expandedSummaries, linkId]);
			}
		} finally {
			summarizingId = null;
		}
	}

	function toggleSummary(linkId: string) {
		if (expandedSummaries.has(linkId)) {
			const next = new Set(expandedSummaries);
			next.delete(linkId);
			expandedSummaries = next;
		} else {
			expandedSummaries = new Set([...expandedSummaries, linkId]);
		}
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

	function handleDragStart(e: DragEvent, linkId: string) {
		draggedId = linkId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, linkId: string) {
		e.preventDefault();
		if (draggedId && draggedId !== linkId) {
			dragOverId = linkId;
		}
	}

	function handleDragLeave() {
		dragOverId = null;
	}

	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!draggedId || draggedId === targetId) {
			dragOverId = null;
			return;
		}

		const draggedIndex = links.findIndex(l => l.id === draggedId);
		const targetIndex = links.findIndex(l => l.id === targetId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		const newLinks = [...links];
		const [removed] = newLinks.splice(draggedIndex, 1);
		newLinks.splice(targetIndex, 0, removed);
		links = newLinks;

		fetch('/api/links/reorder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderedIds: newLinks.map(l => l.id) })
		});

		draggedId = null;
		dragOverId = null;
	}

	function handleDragEnd() {
		draggedId = null;
		dragOverId = null;
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
		<a
			href="/settings"
			class="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
			title="Settings"
		>
			⚙️
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
					draggable="true"
					ondragstart={(e) => handleDragStart(e, link.id)}
					ondragover={(e) => handleDragOver(e, link.id)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, link.id)}
					ondragend={handleDragEnd}
					class="group flex items-start gap-4 p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg border transition-all duration-300 cursor-grab active:cursor-grabbing {draggedId === link.id ? 'opacity-50' : ''} {dragOverId === link.id ? 'border-[var(--color-primary)] border-2' : ''} {animatingPinId === link.id ? (link.pinned ? 'border-yellow-500 bg-yellow-500/10' : 'border-[var(--color-border)]') : 'border-[var(--color-border)]'}"
				>
					{#if link.favicon}
						<img
							src={link.favicon}
							alt=""
							class="w-5 h-5 mt-0.5 rounded shrink-0 {link.favicon.includes('github.githubassets.com') ? 'dark:invert' : ''}"
							onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
						/>
					{/if}
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
							<button
								type="button"
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); link.summary ? toggleSummary(link.id) : summarize(link.id); }}
								class="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
								disabled={summarizingId === link.id}
							>
								{#if summarizingId === link.id}
									<span class="animate-pulse">Summarizing...</span>
								{:else if link.summary}
									{expandedSummaries.has(link.id) ? '▼ Hide' : '▶ Show'} summary
								{:else}
									✨ Summarize
								{/if}
							</button>
						</div>
						{#if link.summary && expandedSummaries.has(link.id)}
							<div class="mt-3 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
								<p class="text-sm text-[var(--color-text)]">{link.summary}</p>
								<button
									type="button"
									onclick={(e) => { e.preventDefault(); e.stopPropagation(); summarize(link.id, true); }}
									class="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
									disabled={summarizingId === link.id}
								>
									🔄 Regenerate
								</button>
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-1 shrink-0">
						<button
							type="button"
							onclick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(link.id, link.pinned); }}
							class="text-lg transition-all cursor-pointer p-2 rounded hover:bg-[var(--color-bg)] {link.pinned ? 'text-yellow-500 opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'} {animatingPinId === link.id ? 'animate-bounce' : 'hover:scale-110'}"
							title={link.pinned ? 'Unpin' : 'Pin'}
							style="pointer-events: auto;"
						>
							📌
						</button>
						<button
							type="button"
							onclick={(e) => { e.preventDefault(); e.stopPropagation(); refreshMetadata(link.id); }}
							class="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity p-2 rounded hover:bg-[var(--color-bg)] {refreshingId === link.id ? 'animate-spin' : ''}"
							title="Refresh metadata"
							disabled={refreshingId === link.id}
						>
							🔄
						</button>
						<a
							href="/links/{link.id}/edit"
							class="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity p-2 rounded hover:bg-[var(--color-bg)]"
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
