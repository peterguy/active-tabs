<script lang="ts">
	const guides = [
		{
			id: 'slack',
			name: 'Slack',
			icon: '💬',
			description: 'Connect to fetch channel names and message previews'
		},
		{
			id: 'google',
			name: 'Google Docs & Sheets',
			icon: '📄',
			description: 'Connect to fetch document and spreadsheet titles'
		},
		{
			id: 'github',
			name: 'GitHub',
			icon: '🐙',
			description: 'Connect to fetch PR and issue titles from private repos'
		},
		{
			id: 'linear',
			name: 'Linear',
			icon: '📋',
			description: 'Connect to fetch issue and project details'
		},
		{
			id: 'notion',
			name: 'Notion',
			icon: '📝',
			description: 'Connect to fetch page titles'
		}
	];
</script>

<svelte:head>
	<title>Help - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/settings" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Settings</a>
		<h1 class="text-2xl font-bold mt-4">Help & Setup Guides</h1>
		<p class="text-[var(--color-text-muted)] mt-2">
			Learn how to connect services to fetch rich metadata from your links.
		</p>
	</header>

	<section class="mb-8">
		<h2 class="text-lg font-medium mb-4">Integration Guides</h2>
		<ul class="space-y-3">
			{#each guides as guide (guide.id)}
				<li>
					<a
						href="/help/{guide.id}"
						class="flex items-center gap-4 p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border)] transition-colors"
					>
						<span class="text-2xl">{guide.icon}</span>
						<div class="flex-1">
							<h3 class="font-medium">{guide.name}</h3>
							<p class="text-sm text-[var(--color-text-muted)]">{guide.description}</p>
						</div>
						<span class="text-[var(--color-text-muted)]">→</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
		<h3 class="font-medium mb-2">🤖 LLM Summaries</h3>
		<p class="text-sm text-[var(--color-text-muted)] mb-3">
			Active Tabs can generate AI summaries of your links using Ollama, a local LLM runner.
		</p>
		<ol class="text-sm text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
			<li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">ollama.ai</a></li>
			<li>Run <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded">ollama run llama3.2</code> to download and start a model</li>
			<li>Click "✨ Summarize" on any link to generate a summary</li>
		</ol>
	</section>
</main>
