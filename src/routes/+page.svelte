<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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

	{#if data.links.length === 0}
		<div class="text-center py-16 text-[var(--color-text-muted)]">
			<p class="text-lg">No links yet.</p>
			<p class="mt-2">Add your first link to get started!</p>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each data.links as link}
				<li
					class="group flex items-start gap-4 p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border)] transition-colors"
				>
					<div class="flex-1 min-w-0">
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-[var(--color-primary)] hover:underline font-medium block truncate"
							data-link-id={link.id}
						>
							{link.title || link.url}
						</a>
						{#if link.description}
							<p class="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
								{link.description}
							</p>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if link.pinned}
							<span class="text-yellow-500" title="Pinned">📌</span>
						{/if}
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
