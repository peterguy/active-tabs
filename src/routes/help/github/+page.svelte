<svelte:head>
	<title>GitHub Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<div class="flex items-center gap-3 mt-4">
			<span class="text-3xl">🐙</span>
			<h1 class="text-2xl font-bold">GitHub Integration Setup</h1>
		</div>
		<p class="text-[var(--color-text-muted)] mt-2">
			Connect GitHub to fetch PR and issue titles from private repositories.
		</p>
	</header>

	<div class="prose prose-invert max-w-none space-y-8">
		<section>
			<h2 class="text-lg font-medium mb-4">Step 1: Create a Personal Access Token</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="https://github.com/settings/tokens/new?scopes=repo,read:user" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">GitHub Token Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Give your token a name (e.g., "Active Tabs")</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Select expiration (or "No expiration" for convenience)</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<div>
						<span>Ensure these scopes are selected:</span>
						<ul class="mt-2 space-y-1 ml-4">
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">repo</code> — Access private repositories</li>
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">read:user</code> — Read user info</li>
						</ul>
					</div>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">5.</span>
					<span>Click <strong>Generate token</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">6.</span>
					<span>Copy the token immediately (you won't see it again)</span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 2: Add Token to Active Tabs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="/settings" class="text-[var(--color-primary)] hover:underline">Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Find <strong>GitHub</strong> and click <strong>Connect</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Paste your token and click <strong>Save Token</strong></span>
				</li>
			</ol>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">What Works</h2>
			<ul class="space-y-2 text-sm">
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Pull Requests</strong> — Shows "PR #123: Title"</span>
				</li>
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Issues</strong> — Shows "Issue #456: Title"</span>
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
