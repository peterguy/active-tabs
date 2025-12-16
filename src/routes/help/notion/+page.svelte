<svelte:head>
	<title>Notion Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<div class="flex items-center gap-3 mt-4">
			<span class="text-3xl">📝</span>
			<h1 class="text-2xl font-bold">Notion Integration Setup</h1>
		</div>
		<p class="text-[var(--color-text-muted)] mt-2">
			Connect Notion to fetch page titles for your saved links.
		</p>
	</header>

	<div class="prose prose-invert max-w-none space-y-8">
		<section class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
			<h2 class="text-lg font-medium text-yellow-200 mb-2">⚠️ Workspace Admin Required</h2>
			<p class="text-sm text-yellow-100">
				Creating a Notion internal integration requires admin access to the workspace. 
				If you're not an admin, ask your workspace admin to create an integration and share the token with you.
			</p>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-2">Prerequisites</h2>
			<ul class="text-sm text-[var(--color-text-muted)] space-y-1">
				<li>• A Notion account</li>
				<li>• Workspace admin access (to create the integration)</li>
			</ul>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 1: Create an Internal Integration</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="https://www.notion.so/profile/integrations" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">Notion Integrations</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>New integration</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Name it (e.g., "Active Tabs") and select your workspace</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Keep the type as <strong>Internal</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">5.</span>
					<div>
						<span>Under <strong>Capabilities</strong>, enable:</span>
						<ul class="mt-2 space-y-1 ml-4">
							<li>✅ <strong>Read content</strong> — Required to fetch page titles</li>
						</ul>
					</div>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">6.</span>
					<span>Click <strong>Save changes</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 2: Copy the Token</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>On the integration page, find <strong>Internal Integration Secret</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>Show</strong> then <strong>Copy</strong></span>
				</li>
			</ol>
			<div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
				<p class="text-sm text-blue-200">
					The token starts with <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">ntn_</code> or <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">secret_</code>
				</p>
			</div>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 3: Connect Pages to the Integration</h2>
			<p class="text-sm text-[var(--color-text-muted)] mb-4">
				Internal integrations can only access pages that are explicitly connected to them.
			</p>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Open a Notion page you want to access</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click the <strong>•••</strong> menu in the top right</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Select <strong>Connections</strong> → <strong>Connect to</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Find and select your integration (e.g., "Active Tabs")</span>
				</li>
			</ol>
			<div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
				<p class="text-sm text-yellow-200">
					<strong>Tip:</strong> Connect a parent page to automatically include all child pages.
				</p>
			</div>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 4: Add Token to Active Tabs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="/settings" class="text-[var(--color-primary)] hover:underline">Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Find <strong>Notion</strong> and click <strong>Connect</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Paste your integration token</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Click <strong>Save Token</strong></span>
				</li>
			</ol>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">What Works</h2>
			<ul class="space-y-2 text-sm">
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Pages</strong> — Shows page title (for pages connected to the integration)</span>
				</li>
			</ul>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">Troubleshooting</h2>
			<dl class="space-y-3 text-sm">
				<div>
					<dt class="font-medium text-red-400">Page title not showing</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Make sure the page is connected to your integration. Open the page → ••• menu → Connections → Connect to → select your integration.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">"Unauthorized" error</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Check that your token is correct and hasn't been regenerated.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">Can't create integration</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">You need to be a workspace admin. Ask an admin to create the integration and share the token.</dd>
				</div>
			</dl>
		</section>
	</div>

	<div class="mt-8">
		<a href="/settings" class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors">
			Go to Settings →
		</a>
	</div>
</main>
