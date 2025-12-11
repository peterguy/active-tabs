<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Add Link - Active Tabs</title>
</svelte:head>

<main class="max-w-2xl mx-auto p-6">
	<header class="mb-8">
		<a href="/" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Back</a>
		<h1 class="text-2xl font-bold mt-4">Add New Link</h1>
	</header>

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<div>
			<label for="url" class="block text-sm font-medium mb-2">URL *</label>
			<input
				type="url"
				id="url"
				name="url"
				required
				placeholder="https://example.com"
				value={form?.url ?? ''}
				class="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
			/>
		</div>

		<div>
			<label for="title" class="block text-sm font-medium mb-2">Title</label>
			<input
				type="text"
				id="title"
				name="title"
				placeholder="Optional - will be auto-detected if left blank"
				value={form?.title ?? ''}
				class="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)]"
			/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium mb-2">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				placeholder="Optional - describe what this link is for"
				class="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] resize-none"
			>{form?.description ?? ''}</textarea>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="pinned"
				name="pinned"
				class="w-4 h-4 rounded bg-[var(--color-surface)] border-[var(--color-border)]"
			/>
			<label for="pinned" class="text-sm">Pin this link</label>
		</div>

		<button
			type="submit"
			class="w-full px-4 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-lg transition-colors"
		>
			Add Link
		</button>
	</form>
</main>
