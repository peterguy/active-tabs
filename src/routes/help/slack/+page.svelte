<svelte:head>
	<title>Slack Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<div class="flex items-center gap-3 mt-4">
			<span class="text-3xl">💬</span>
			<h1 class="text-2xl font-bold">Slack Integration Setup</h1>
		</div>
		<p class="text-[var(--color-text-muted)] mt-2">
			Connect Slack to fetch channel names, descriptions, and message previews for your saved links.
		</p>
	</header>

	<div class="prose prose-invert max-w-none space-y-8">
		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-2">Prerequisites</h2>
			<p class="text-sm text-[var(--color-text-muted)]">
				You need access to a Slack workspace where you have permission to create apps.
			</p>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 1: Create a Slack App</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">api.slack.com/apps</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>Create New App</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Choose <strong>From scratch</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Name your app (e.g., "Active Tabs") and select your workspace</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">5.</span>
					<span>Click <strong>Create App</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 2: Configure OAuth Scopes</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>In the left sidebar, click <strong>OAuth & Permissions</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Scroll to <strong>User Token Scopes</strong> (not Bot Token Scopes!)</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<div>
						<span>Add these scopes:</span>
						<ul class="mt-2 space-y-1 ml-4">
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">channels:read</code> — View basic info about public channels</li>
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">channels:history</code> — View messages in public channels</li>
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">groups:read</code> — View private channels (optional)</li>
							<li><code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">groups:history</code> — View private channel messages (optional)</li>
						</ul>
					</div>
				</li>
			</ol>
			<div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
				<p class="text-sm text-yellow-200">
					<strong>Important:</strong> Use <strong>User Token Scopes</strong>, not Bot Token Scopes. 
					Bot tokens get "not_in_channel" errors because bots must be invited to each channel.
				</p>
			</div>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 3: Install the App</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Scroll to the top of the <strong>OAuth & Permissions</strong> page</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>Install to Workspace</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Review the permissions and click <strong>Allow</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 4: Copy the User OAuth Token</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>After installation, you'll see <strong>OAuth Tokens for Your Workspace</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Copy the <strong>User OAuth Token</strong> (starts with <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">xoxp-</code>)</span>
				</li>
			</ol>
			<div class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
				<p class="text-sm text-red-200">
					<strong>Use the User token</strong>, NOT the Bot User OAuth Token (which starts with <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">xoxb-</code>).
				</p>
			</div>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 5: Add Token to Active Tabs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="/settings" class="text-[var(--color-primary)] hover:underline">Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Find <strong>Slack</strong> and click <strong>Connect</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Paste your User OAuth Token and click <strong>Save Token</strong></span>
				</li>
			</ol>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">What Works</h2>
			<ul class="space-y-2 text-sm">
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Channel links</strong> — Shows channel name and description</span>
				</li>
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Message links</strong> — Shows message preview with channel name</span>
				</li>
			</ul>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">Troubleshooting</h2>
			<dl class="space-y-3 text-sm">
				<div>
					<dt class="font-medium text-red-400">"not_in_channel" error</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">You're using a Bot token. Switch to the User OAuth Token.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">No message preview showing</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Make sure your link includes <code class="px-1 py-0.5 bg-[var(--color-bg)] rounded text-xs">/p</code> followed by the message timestamp.</dd>
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
