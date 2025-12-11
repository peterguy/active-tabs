<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showDeleteConfirm = $state(false);
</script>

<svelte:head>
	<title>Edit Link - Active Tabs</title>
</svelte:head>

<main class="max-w-2xl mx-auto p-6">
	<header class="mb-8">
		<a href="/" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Back</a>
		<h1 class="text-2xl font-bold mt-4">Edit Link</h1>
	</header>

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="space-y-6">
		<div>
			<label for="url" class="block text-sm font-medium mb-2">URL *</label>
			<input
				type="url"
				id="url"
				name="url"
				required
				placeholder="https://example.com"
				value={form?.url ?? data.link.url}
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
				value={form?.title ?? data.link.title ?? ''}
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
			>{form?.description ?? data.link.description ?? ''}</textarea>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="pinned"
				name="pinned"
				checked={data.link.pinned}
				class="w-4 h-4 rounded bg-[var(--color-surface)] border-[var(--color-border)]"
			/>
			<label for="pinned" class="text-sm">Pin this link</label>
		</div>

		<div class="flex gap-3">
			<button
				type="submit"
				class="flex-1 px-4 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-lg transition-colors"
			>
				Save Changes
			</button>
			<button
				type="button"
				onclick={() => (showDeleteConfirm = true)}
				class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
			>
				Delete
			</button>
		</div>
	</form>

	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
			<div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 max-w-sm w-full">
				<h2 class="text-lg font-bold mb-4">Delete Link?</h2>
				<p class="text-[var(--color-text-muted)] mb-6">This action cannot be undone.</p>
				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => (showDeleteConfirm = false)}
						class="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
					>
						Cancel
					</button>
					<form method="POST" action="?/delete" use:enhance class="flex-1">
						<button
							type="submit"
							class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
						>
							Delete
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</main>
