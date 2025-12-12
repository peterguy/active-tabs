<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingService: string | null = $state(null);
	let tokenInput = $state('');

	function startEditing(serviceId: string) {
		editingService = serviceId;
		tokenInput = '';
	}

	function cancelEditing() {
		editingService = null;
		tokenInput = '';
	}

	const serviceIcons: Record<string, string> = {
		github: '🐙',
		slack: '💬',
		linear: '📋',
		notion: '📝'
	};
</script>

<svelte:head>
	<title>Settings - Active Tabs</title>
</svelte:head>

<main class="max-w-2xl mx-auto p-6">
	<header class="mb-8">
		<a href="/" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Back</a>
		<h1 class="text-2xl font-bold mt-4">Settings</h1>
		<p class="text-[var(--color-text-muted)] mt-2">Connect services to fetch content from authenticated pages.</p>
	</header>

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
			{#if form.deleted}
				Disconnected {form.deleted}
			{:else}
				Connected {form.service} successfully!
			{/if}
		</div>
	{/if}

	<section>
		<h2 class="text-lg font-medium mb-4">Connected Services</h2>
		<ul class="space-y-3">
			{#each data.services as service (service.id)}
				<li class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
					<div class="flex items-start gap-4">
						<span class="text-2xl">{serviceIcons[service.id] || '🔗'}</span>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h3 class="font-medium">{service.name}</h3>
								{#if service.isConfigured}
									<span class="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
										Connected
									</span>
								{/if}
							</div>
							<p class="text-sm text-[var(--color-text-muted)] mt-1">{service.description}</p>
							
							{#if editingService === service.id}
								<form method="POST" action="?/save" use:enhance={() => {
									return async ({ update }) => {
										await update();
										cancelEditing();
									};
								}} class="mt-4 space-y-3">
									<input type="hidden" name="service" value={service.id} />
									<div>
										<label for="token-{service.id}" class="block text-sm mb-1">{service.tokenLabel}</label>
										<input
											type="password"
											id="token-{service.id}"
											name="token"
											bind:value={tokenInput}
											placeholder="Paste your token here"
											class="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
										/>
									</div>
									<div class="flex gap-2">
										<button
											type="submit"
											class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
										>
											Save Token
										</button>
										<button
											type="button"
											onclick={cancelEditing}
											class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
										>
											Cancel
										</button>
									</div>
									<p class="text-xs text-[var(--color-text-muted)]">
										<a href={service.tokenUrl} target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">
											Get a token from {service.name} →
										</a>
									</p>
								</form>
							{:else}
								<div class="mt-3 flex gap-2">
									{#if service.isConfigured}
										<button
											type="button"
											onclick={() => startEditing(service.id)}
											class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
										>
											Update Token
										</button>
										<form method="POST" action="?/delete" use:enhance class="inline">
											<input type="hidden" name="service" value={service.id} />
											<button
												type="submit"
												class="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm rounded-lg transition-colors"
											>
												Disconnect
											</button>
										</form>
									{:else}
										<button
											type="button"
											onclick={() => startEditing(service.id)}
											class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
										>
											Connect
										</button>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-8 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
		<h3 class="font-medium mb-2">🔐 Security Note</h3>
		<p class="text-sm text-[var(--color-text-muted)]">
			Your tokens are encrypted using AES-256-GCM before being stored locally. 
			They never leave your machine and are only used to fetch content from the services you connect.
		</p>
	</section>
</main>
