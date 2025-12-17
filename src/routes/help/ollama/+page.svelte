<script lang="ts">
	import { onMount } from 'svelte';
	
	let ollamaStatus: 'checking' | 'online' | 'offline' = $state('checking');
	let models: string[] = $state([]);
	
	onMount(async () => {
		try {
			const res = await fetch('/api/ollama');
			const data = await res.json();
			ollamaStatus = data.available ? 'online' : 'offline';
			models = data.models?.map((m: { name: string }) => m.name) || [];
		} catch {
			ollamaStatus = 'offline';
		}
	});
</script>

<svelte:head>
	<title>LLM Summaries Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<h1 class="text-2xl font-bold mt-4">🤖 LLM Summaries with Ollama</h1>
		<p class="text-[var(--color-text-muted)] mt-2">
			Generate AI-powered summaries of your links using a local LLM.
		</p>
	</header>

	<!-- Status indicator -->
	<section class="mb-8 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
		<h2 class="font-medium mb-3">Current Status</h2>
		{#if ollamaStatus === 'checking'}
			<p class="text-[var(--color-text-muted)]">Checking Ollama connection...</p>
		{:else if ollamaStatus === 'online'}
			<p class="text-green-400">✅ Ollama is running and ready</p>
			{#if models.length > 0}
				<p class="text-sm text-[var(--color-text-muted)] mt-2">
					Available models: {models.join(', ')}
				</p>
			{/if}
		{:else}
			<p class="text-red-400">❌ Ollama is not running</p>
			<p class="text-sm text-[var(--color-text-muted)] mt-1">
				Follow the setup instructions below to get started.
			</p>
		{/if}
	</section>

	<!-- Setup instructions -->
	<section class="mb-8">
		<h2 class="text-lg font-medium mb-4">Setup Instructions</h2>
		
		<div class="space-y-6">
			<div class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<h3 class="font-medium mb-2">1. Install Ollama</h3>
				<p class="text-sm text-[var(--color-text-muted)] mb-3">
					Download and install Ollama from the official website:
				</p>
				<a 
					href="https://ollama.ai" 
					target="_blank" 
					rel="noopener noreferrer"
					class="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity"
				>
					Download Ollama →
				</a>
			</div>

			<div class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<h3 class="font-medium mb-2">2. Download a Model</h3>
				<p class="text-sm text-[var(--color-text-muted)] mb-3">
					After installing, open a terminal and run one of these commands:
				</p>
				<div class="space-y-2">
					<div class="p-2 bg-[var(--color-bg)] rounded font-mono text-sm">
						ollama run llama3.2
					</div>
					<p class="text-xs text-[var(--color-text-muted)]">
						Recommended: Good balance of speed and quality (~2GB)
					</p>
				</div>
				<div class="mt-4 space-y-2">
					<p class="text-sm text-[var(--color-text-muted)]">Alternative models:</p>
					<ul class="text-sm text-[var(--color-text-muted)] space-y-1 ml-4 list-disc">
						<li><code>ollama run mistral</code> - Fast, good for summaries (~4GB)</li>
						<li><code>ollama run llama3.1</code> - Higher quality, slower (~8GB)</li>
						<li><code>ollama run phi3</code> - Lightweight option (~2GB)</li>
					</ul>
				</div>
			</div>

			<div class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<h3 class="font-medium mb-2">3. Keep Ollama Running</h3>
				<p class="text-sm text-[var(--color-text-muted)]">
					Ollama needs to be running in the background for summaries to work. 
					On macOS, it runs as a menu bar app after installation. 
					On Linux, run <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded">ollama serve</code> in a terminal.
				</p>
			</div>
		</div>
	</section>

	<!-- Usage -->
	<section class="mb-8">
		<h2 class="text-lg font-medium mb-4">How to Use</h2>
		<div class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<ol class="space-y-3 text-sm">
				<li class="flex gap-3">
					<span class="flex-shrink-0 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs">1</span>
					<span>Click <strong>"✨ Summarize"</strong> on any link in your list</span>
				</li>
				<li class="flex gap-3">
					<span class="flex-shrink-0 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs">2</span>
					<span>Wait a few seconds while the AI generates a summary</span>
				</li>
				<li class="flex gap-3">
					<span class="flex-shrink-0 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs">3</span>
					<span>Click <strong>"▼ Hide summary"</strong> to collapse, or <strong>"🔄 Regenerate"</strong> to create a new one</span>
				</li>
			</ol>
		</div>
	</section>

	<!-- Supported services -->
	<section class="mb-8">
		<h2 class="text-lg font-medium mb-4">Supported Content Sources</h2>
		<p class="text-sm text-[var(--color-text-muted)] mb-4">
			For best results, connect your services in Settings. This allows Active Tabs to fetch 
			the actual content for summarization instead of just the page metadata.
		</p>
		<div class="grid gap-3">
			<div class="p-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)] flex items-center gap-3">
				<span class="text-xl">📝</span>
				<div>
					<p class="font-medium">Notion</p>
					<p class="text-xs text-[var(--color-text-muted)]">Full page content via MCP integration</p>
				</div>
			</div>
			<div class="p-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)] flex items-center gap-3">
				<span class="text-xl">🐙</span>
				<div>
					<p class="font-medium">GitHub</p>
					<p class="text-xs text-[var(--color-text-muted)]">PR and issue descriptions</p>
				</div>
			</div>
			<div class="p-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)] flex items-center gap-3">
				<span class="text-xl">📋</span>
				<div>
					<p class="font-medium">Linear</p>
					<p class="text-xs text-[var(--color-text-muted)]">Issue descriptions, project updates, and comments</p>
				</div>
			</div>
			<div class="p-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)] flex items-center gap-3">
				<span class="text-xl">🌐</span>
				<div>
					<p class="font-medium">Regular web pages</p>
					<p class="text-xs text-[var(--color-text-muted)]">HTML content extraction (works for most public pages)</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Troubleshooting -->
	<section>
		<h2 class="text-lg font-medium mb-4">Troubleshooting</h2>
		<div class="space-y-4 text-sm">
			<details class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<summary class="font-medium cursor-pointer">"Ollama is not available" error</summary>
				<p class="mt-2 text-[var(--color-text-muted)]">
					Make sure Ollama is running. On macOS, check the menu bar for the Ollama icon. 
					On Linux, run <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded">ollama serve</code>.
				</p>
			</details>
			<details class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<summary class="font-medium cursor-pointer">Summaries are slow</summary>
				<p class="mt-2 text-[var(--color-text-muted)]">
					Summary speed depends on your hardware and the model size. Try a smaller model 
					like <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded">phi3</code> for faster results.
				</p>
			</details>
			<details class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
				<summary class="font-medium cursor-pointer">Summary says "no content available"</summary>
				<p class="mt-2 text-[var(--color-text-muted)]">
					Some pages require authentication or JavaScript to load content. 
					Connect the relevant service in Settings for better results with Notion, GitHub, and Linear links.
				</p>
			</details>
		</div>
	</section>
</main>
