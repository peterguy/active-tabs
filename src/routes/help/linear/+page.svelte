<svelte:head>
	<title>Linear Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<div class="flex items-center gap-3 mt-4">
			<span class="text-3xl">📋</span>
			<h1 class="text-2xl font-bold">Linear Integration Setup</h1>
		</div>
		<p class="text-[var(--color-text-muted)] mt-2">
			Connect Linear to fetch issue and project details.
		</p>
	</header>

	<div class="prose prose-invert max-w-none space-y-8">
		<section>
			<h2 class="text-lg font-medium mb-4">Step 1: Create an API Key</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="https://linear.app/settings/api" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">Linear API Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>Create key</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Give it a name (e.g., "Active Tabs")</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Copy the API key</span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 2: Add Key to Active Tabs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="/settings" class="text-[var(--color-primary)] hover:underline">Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Find <strong>Linear</strong> and click <strong>Connect</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Paste your API key and click <strong>Save Token</strong></span>
				</li>
			</ol>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">What Works</h2>
			<ul class="space-y-2 text-sm">
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Issues</strong> — Shows "ENG-123: Title [Status]"</span>
				</li>
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Projects</strong> — Shows "Project Name [Status]"</span>
				</li>
			</ul>
		</section>
	</div>

	<div class="mt-8">
		<a href="/settings" class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors">
			Go to Settings →
		</a>
	</div>
</main>
