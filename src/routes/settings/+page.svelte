<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingService: string | null = $state(null);
	let configuringGoogle = $state(false);
	let tokenInput = $state('');
	let googleClientId = $state('');
	let googleClientSecret = $state('');

	function startEditing(serviceId: string) {
		editingService = serviceId;
		tokenInput = '';
	}

	function cancelEditing() {
		editingService = null;
		tokenInput = '';
	}

	function startGoogleConfig() {
		configuringGoogle = true;
		googleClientId = '';
		googleClientSecret = '';
	}

	function cancelGoogleConfig() {
		configuringGoogle = false;
	}

	const serviceIcons: Record<string, string> = {
		github: '🐙',
		slack: '💬',
		google: '📄',
		linear: '📋',
		notion: '📝'
	};

	const errorMessages: Record<string, string> = {
		google_not_configured: 'Please configure Google OAuth first.',
		google_auth_denied: 'Google authorization was denied.',
		google_token_exchange_failed: 'Failed to connect to Google. Please try again.'
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

	{#if data.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{errorMessages[data.error] || data.error}
		</div>
	{/if}

	{#if data.success === 'google_connected'}
		<div class="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
			Successfully connected to Google!
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	{#if form?.success && !form?.configSaved}
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
								{:else if service.requiresOAuth && service.hasOAuthConfig}
									<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
										Configured
									</span>
								{/if}
							</div>
							<p class="text-sm text-[var(--color-text-muted)] mt-1">{service.description}</p>
							
							{#if service.requiresOAuth}
								<!-- Google OAuth Flow -->
								{#if configuringGoogle && service.id === 'google'}
									<form method="POST" action="?/saveGoogleConfig" use:enhance={() => {
										return async ({ update }) => {
											await update();
											cancelGoogleConfig();
										};
									}} class="mt-4 space-y-3">
										<p class="text-sm text-[var(--color-text-muted)]">
											Create an OAuth app in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">Google Cloud Console</a>:
										</p>
										<ol class="text-xs text-[var(--color-text-muted)] list-decimal list-inside space-y-1">
											<li>Create a new OAuth 2.0 Client ID (Web application)</li>
											<li>Add <code class="bg-[var(--color-bg)] px-1 rounded">http://localhost:5173/auth/google/callback</code> as an Authorized redirect URI</li>
											<li>Copy the Client ID and Client Secret below</li>
										</ol>
										<div>
											<label for="clientId" class="block text-sm mb-1">Client ID</label>
											<input
												type="text"
												id="clientId"
												name="clientId"
												bind:value={googleClientId}
												placeholder="xxxx.apps.googleusercontent.com"
												class="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
											/>
										</div>
										<div>
											<label for="clientSecret" class="block text-sm mb-1">Client Secret</label>
											<input
												type="password"
												id="clientSecret"
												name="clientSecret"
												bind:value={googleClientSecret}
												placeholder="GOCSPX-..."
												class="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
											/>
										</div>
										<div class="flex gap-2">
											<button
												type="submit"
												class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
											>
												Save Configuration
											</button>
											<button
												type="button"
												onclick={cancelGoogleConfig}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
											>
												Cancel
											</button>
										</div>
									</form>
								{:else}
									<div class="mt-3 flex gap-2">
										{#if service.isConfigured}
											<form method="POST" action="?/delete" use:enhance class="inline">
												<input type="hidden" name="service" value={service.id} />
												<button
													type="submit"
													class="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm rounded-lg transition-colors"
												>
													Disconnect
												</button>
											</form>
										{:else if service.hasOAuthConfig}
											<a
												href="/auth/google"
												class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
											>
												Connect with Google
											</a>
											<button
												type="button"
												onclick={startGoogleConfig}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
											>
												Update Config
											</button>
										{:else}
											<button
												type="button"
												onclick={startGoogleConfig}
												class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
											>
												Configure OAuth
											</button>
										{/if}
									</div>
								{/if}
							{:else}
								<!-- Regular PAT Flow -->
								{#if editingService === service.id}
									<form method="POST" action="?/save" use:enhance={() => {
										return async ({ update }) => {
											await update();
											cancelEditing();
										};
									}} class="mt-4 space-y-3">
										<input type="hidden" name="service" value={service.id} />
										<div>
											<label for="token-{service.id}" class="block text-sm mb-1">Personal Access Token</label>
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
