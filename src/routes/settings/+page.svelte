<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingService: string | null = $state(null);
	let tokenInput = $state('');
	let googleClientId = $state('');
	let googleClientSecret = $state('');
	let testingService: string | null = $state(null);
	let testResults: Record<string, { success: boolean; message: string }> = $state({});
	let notionMCPConnecting = $state(false);
	let notionMCPDisconnecting = $state(false);

	function startEditing(serviceId: string) {
		editingService = serviceId;
		tokenInput = '';
		googleClientId = '';
		googleClientSecret = '';
	}

	function cancelEditing() {
		editingService = null;
		tokenInput = '';
		googleClientId = '';
		googleClientSecret = '';
	}

	const serviceIcons: Record<string, string> = {
		github: '🐙',
		slack: '💬',
		linear: '📋',
		notion: '📝',
		google: '📄'
	};

	function openOAuthPopup(service: string) {
		const width = 500;
		const height = 600;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;
		const popup = window.open(
			`/api/auth/${service}`,
			`${service}-auth`,
			`width=${width},height=${height},left=${left},top=${top}`
		);

		const checkClosed = setInterval(() => {
			if (popup?.closed) {
				clearInterval(checkClosed);
				window.location.reload();
			}
		}, 500);
	}

	function openGoogleAuth() {
		openOAuthPopup('google');
	}

	function openNotionAuth() {
		openOAuthPopup('notion');
	}

	async function testConnection(serviceId: string) {
		testingService = serviceId;
		delete testResults[serviceId];
		
		try {
			const res = await fetch(`/api/credentials/${serviceId}/test`, { method: 'POST' });
			const result = await res.json();
			testResults[serviceId] = { success: result.success, message: result.message };
		} catch {
			testResults[serviceId] = { success: false, message: 'Test request failed' };
		} finally {
			testingService = null;
		}
	}

	function connectNotionMCP() {
		notionMCPConnecting = true;
		window.location.href = '/api/auth/notion-mcp/connect';
	}

	async function disconnectNotionMCP() {
		notionMCPDisconnecting = true;
		try {
			await fetch('/api/auth/notion-mcp/disconnect', { method: 'POST' });
			window.location.reload();
		} catch {
			notionMCPDisconnecting = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - Active Tabs</title>
</svelte:head>

<main class="max-w-2xl mx-auto p-6">
	<header class="mb-8">
		<div class="flex justify-between items-center">
			<a href="/" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Back</a>
			<a href="/help" class="text-[var(--color-primary)] hover:underline text-sm">Setup Guides →</a>
		</div>
		<h1 class="text-2xl font-bold mt-4">Settings</h1>
		<p class="text-[var(--color-text-muted)] mt-2">Connect services to fetch content from authenticated pages.</p>
	</header>

	{#if form?.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{form.error}
		</div>
	{/if}

	{#if data.error}
		<div class="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
			{#if data.error === 'google_not_configured'}
				Google OAuth is not configured. Please enter your Client ID and Secret first.
			{:else if data.error === 'google_auth_failed'}
				Google authentication failed. Please try again.
			{:else if data.error === 'google_token_exchange_failed'}
				Failed to complete Google authentication. Please try again.
			{:else}
				{data.error}
			{/if}
		</div>
	{/if}

	{#if form?.success || data.success}
		<div class="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
			{#if form?.deleted}
				Disconnected {form.deleted}
			{:else if form?.configSaved}
				Google OAuth configured! Click "Connect with Google" to authorize.
			{:else if data.success === 'google'}
				Connected to Google successfully!
			{:else if data.success === 'notion_mcp_connected'}
				Connected to Notion via MCP successfully!
			{:else if form?.service}
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
									{#if testResults[service.id]}
										<span class="px-2 py-0.5 text-xs rounded-full {testResults[service.id].success ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}">
											{testResults[service.id].message}
										</span>
									{/if}
								{:else if service.authType === 'oauth' && service.isOAuthConfigured}
									<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
										Ready to connect
									</span>
								{/if}
							</div>
							<p class="text-sm text-[var(--color-text-muted)] mt-1">{service.description}</p>
							
							{#if service.authType === 'oauth'}
								<!-- OAuth flow (Google, Notion) -->
								{#if editingService === service.id}
									<form method="POST" action="?/{service.id === 'google' ? 'saveGoogleConfig' : 'saveNotionConfig'}" use:enhance={() => {
										return async ({ update }) => {
											await update();
											cancelEditing();
										};
									}} class="mt-4 space-y-3">
										<div>
											<label for="clientId-{service.id}" class="block text-sm mb-1">OAuth Client ID</label>
											<input
												type="text"
												id="clientId-{service.id}"
												name="clientId"
												bind:value={googleClientId}
												placeholder={service.id === 'google' ? 'From Google Cloud Console' : 'From Notion Integration Settings'}
												class="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
											/>
										</div>
										<div>
											<label for="clientSecret-{service.id}" class="block text-sm mb-1">OAuth Client Secret</label>
											<input
												type="password"
												id="clientSecret-{service.id}"
												name="clientSecret"
												bind:value={googleClientSecret}
												placeholder={service.id === 'google' ? 'From Google Cloud Console' : 'From Notion Integration Settings'}
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
												onclick={cancelEditing}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
											>
												Cancel
											</button>
										</div>
										<p class="text-xs text-[var(--color-text-muted)]">
											{#if service.id === 'google'}
												<a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">
													Get credentials from Google Cloud Console →
												</a>
											{:else}
												<a href="/help/{service.id}" class="text-[var(--color-primary)] hover:underline">
													View setup guide →
												</a>
											{/if}
										</p>
									</form>
								{:else}
									<div class="mt-3 flex gap-2">
										{#if service.isConfigured}
											<button
												type="button"
												onclick={() => testConnection(service.id)}
												disabled={testingService === service.id}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors disabled:opacity-50"
											>
												{testingService === service.id ? 'Testing...' : 'Test'}
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
										{:else if service.isOAuthConfigured}
											<button
												type="button"
												onclick={() => service.id === 'google' ? openGoogleAuth() : openNotionAuth()}
												class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
											>
												Connect with {service.name}
											</button>
											<button
												type="button"
												onclick={() => startEditing(service.id)}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors"
											>
												Update Config
											</button>
										{:else}
											<button
												type="button"
												onclick={() => startEditing(service.id)}
												class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors"
											>
												Configure
											</button>
										{/if}
									</div>
								{/if}
							{:else}
								<!-- Token-based auth flow -->
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
										{#if service.tokenUrl}
											<p class="text-xs text-[var(--color-text-muted)]">
												<a href={service.tokenUrl} target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">
													Get a token from {service.name} →
												</a>
											</p>
										{/if}
									</form>
								{:else}
									<div class="mt-3 flex gap-2">
										{#if service.isConfigured}
											<button
												type="button"
												onclick={() => testConnection(service.id)}
												disabled={testingService === service.id}
												class="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-sm rounded-lg transition-colors disabled:opacity-50"
											>
												{testingService === service.id ? 'Testing...' : 'Test'}
											</button>
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
			
			<!-- Notion (via MCP OAuth) -->
			<li class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<div class="flex items-start gap-4">
					<span class="text-2xl">📝</span>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-medium">Notion</h3>
							{#if data.notionMCP.connected}
								<span class="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
									Connected
								</span>
							{/if}
						</div>
						<p class="text-sm text-[var(--color-text-muted)] mt-1">Access pages and databases via OAuth</p>
						
						<div class="mt-3 flex gap-2">
							{#if data.notionMCP.connected}
								<button
									type="button"
									onclick={disconnectNotionMCP}
									disabled={notionMCPDisconnecting}
									class="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm rounded-lg transition-colors disabled:opacity-50"
								>
									{notionMCPDisconnecting ? 'Disconnecting...' : 'Disconnect'}
								</button>
							{:else}
								<button
									type="button"
									onclick={connectNotionMCP}
									disabled={notionMCPConnecting}
									class="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
								>
									{notionMCPConnecting ? 'Connecting...' : 'Connect'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			</li>
		</ul>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-medium mb-4">LLM Summarization</h2>
		<div class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-2xl">🤖</span>
				<div>
					<h3 class="font-medium">Ollama</h3>
					<p class="text-sm text-[var(--color-text-muted)]">Local LLM for generating page summaries</p>
				</div>
				{#if data.ollama.available}
					<span class="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
						Running
					</span>
				{:else}
					<span class="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
						Not Available
					</span>
				{/if}
			</div>
			{#if data.ollama.available}
				<div class="mt-3">
					<p class="text-sm text-[var(--color-text-muted)] mb-2">Available models:</p>
					<div class="flex flex-wrap gap-2">
						{#each data.ollama.models as model (model.name)}
							<span class="px-2 py-1 text-xs bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
								{model.name}
							</span>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-sm text-[var(--color-text-muted)]">
					Install and run <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">Ollama</a> to enable AI summaries.
					Run <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded">ollama run llama3.2</code> to get started.
				</p>
			{/if}
		</div>
	</section>

	<section class="mt-8 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
		<h3 class="font-medium mb-2">🔐 Security Note</h3>
		<p class="text-sm text-[var(--color-text-muted)]">
			Your tokens are encrypted using AES-256-GCM before being stored locally. 
			They never leave your machine and are only used to fetch content from the services you connect.
		</p>
	</section>
</main>
