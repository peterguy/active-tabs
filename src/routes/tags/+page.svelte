<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingTag: string | null = $state(null);
	let newTagName = $state('');
	let newTagColor = $state('#3b82f6');

	const colors = [
		'#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
		'#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
	];
</script>

<svelte:head>
	<title>Tags - Active Tabs</title>
</svelte:head>

<main class="max-w-2xl mx-auto p-6">
	<header class="mb-8">
		<a href="/" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Back</a>
		<h1 class="text-2xl font-bold mt-4">Manage Tags</h1>
	</header>

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/create" use:enhance={() => {
		return async ({ update }) => {
			await update();
			newTagName = '';
			newTagColor = '#3b82f6';
		};
	}} class="mb-8 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
		<h2 class="text-lg font-medium mb-4">Create New Tag</h2>
		<div class="flex gap-3">
			<input
				type="text"
				name="name"
				bind:value={newTagName}
				placeholder="Tag name"
				class="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
			/>
			<div class="flex gap-1">
				{#each colors as color}
					<button
						type="button"
						onclick={() => newTagColor = color}
						class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
						style="background-color: {color}; border-color: {newTagColor === color ? 'white' : 'transparent'}"
					></button>
				{/each}
			</div>
			<input type="hidden" name="color" value={newTagColor} />
			<button
				type="submit"
				class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors"
			>
				Add
			</button>
		</div>
	</form>

	{#if data.tags.length === 0}
		<p class="text-center text-[var(--color-text-muted)] py-8">No tags yet. Create one above!</p>
	{:else}
		<ul class="space-y-2">
			{#each data.tags as tag (tag.id)}
				<li class="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
					{#if editingTag === tag.id}
						<form method="POST" action="?/update" use:enhance={() => {
							return async ({ update }) => {
								await update();
								editingTag = null;
							};
						}} class="flex-1 flex items-center gap-3">
							<input type="hidden" name="id" value={tag.id} />
							<input
								type="text"
								name="name"
								value={tag.name}
								class="flex-1 px-3 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
							/>
							<input type="color" name="color" value={tag.color} class="w-8 h-8 rounded cursor-pointer" />
							<button type="submit" class="text-green-500 hover:text-green-400">Save</button>
							<button type="button" onclick={() => editingTag = null} class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Cancel</button>
						</form>
					{:else}
						<span
							class="w-3 h-3 rounded-full"
							style="background-color: {tag.color}"
						></span>
						<span class="flex-1">{tag.name}</span>
						<button
							type="button"
							onclick={() => editingTag = tag.id}
							class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
						>
							Edit
						</button>
						<form method="POST" action="?/delete" use:enhance class="inline">
							<input type="hidden" name="id" value={tag.id} />
							<button type="submit" class="text-red-500 hover:text-red-400">Delete</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
