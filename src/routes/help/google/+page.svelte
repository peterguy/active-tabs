<svelte:head>
	<title>Google Setup - Active Tabs</title>
</svelte:head>

<main class="max-w-3xl mx-auto p-6">
	<header class="mb-8">
		<a href="/help" class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← Help</a>
		<div class="flex items-center gap-3 mt-4">
			<span class="text-3xl">📄</span>
			<h1 class="text-2xl font-bold">Google Docs & Sheets Setup</h1>
		</div>
		<p class="text-[var(--color-text-muted)] mt-2">
			Connect Google to fetch document and spreadsheet titles for your saved links.
		</p>
	</header>

	<div class="prose prose-invert max-w-none space-y-8">
		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-2">Prerequisites</h2>
			<ul class="text-sm text-[var(--color-text-muted)] space-y-1">
				<li>• A Google account (personal or work)</li>
				<li>• Access to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">Google Cloud Console</a></li>
			</ul>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 1: Create a Google Cloud Project</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:underline">console.cloud.google.com</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click the project dropdown (top left) → <strong>New Project</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Name your project (e.g., "Active Tabs") and click <strong>Create</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Wait for creation, then select the project</span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 2: Enable Required APIs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <strong>APIs & Services</strong> → <strong>Library</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<div>
						<span>Search for and enable these APIs:</span>
						<ul class="mt-2 space-y-1 ml-4">
							<li>• <strong>Google Docs API</strong></li>
							<li>• <strong>Google Sheets API</strong></li>
							<li>• <strong>Google Drive API</strong></li>
						</ul>
					</div>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 3: Configure OAuth Consent Screen</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <strong>APIs & Services</strong> → <strong>OAuth consent screen</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Select <strong>External</strong> (or Internal for Google Workspace)</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Click <strong>Create</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<div>
						<span>Fill in required fields:</span>
						<ul class="mt-2 space-y-1 ml-4">
							<li>• App name: "Active Tabs"</li>
							<li>• User support email: Your email</li>
							<li>• Developer contact: Your email</li>
						</ul>
					</div>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">5.</span>
					<span>Click <strong>Save and Continue</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">6.</span>
					<span>On <strong>Scopes</strong>, click <strong>Add or Remove Scopes</strong> and add the drive, docs, and sheets readonly scopes</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">7.</span>
					<span>On <strong>Test users</strong>, add your email address</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">8.</span>
					<span>Click <strong>Save and Continue</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 4: Create OAuth Credentials</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <strong>APIs & Services</strong> → <strong>Credentials</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Click <strong>Create Credentials</strong> → <strong>OAuth client ID</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Application type: <strong>Web application</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Name: "Active Tabs"</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">5.</span>
					<div>
						<span>Under <strong>Authorized redirect URIs</strong>, add:</span>
						<div class="mt-2 p-2 bg-[var(--color-bg)] rounded border border-[var(--color-border)]">
							<code class="text-xs select-all">http://localhost:5173/api/auth/google/callback</code>
						</div>
					</div>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">6.</span>
					<span>Click <strong>Create</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">7.</span>
					<span>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 5: Configure Active Tabs</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Go to <a href="/settings" class="text-[var(--color-primary)] hover:underline">Settings</a></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>Find <strong>Google</strong> and click <strong>Configure</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Paste your <strong>Client ID</strong> and <strong>Client Secret</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>Click <strong>Save Configuration</strong></span>
				</li>
			</ol>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-4">Step 6: Connect Your Google Account</h2>
			<ol class="space-y-2 text-sm">
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">1.</span>
					<span>Click <strong>Connect with Google</strong></span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">2.</span>
					<span>A popup will open for Google authentication</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">3.</span>
					<span>Select your Google account and grant permissions</span>
				</li>
				<li class="flex gap-3">
					<span class="text-[var(--color-primary)] font-medium">4.</span>
					<span>The popup will show success and auto-close</span>
				</li>
			</ol>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">What Works</h2>
			<ul class="space-y-2 text-sm">
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Google Docs</strong> — Shows document title</span>
				</li>
				<li class="flex gap-2">
					<span class="text-green-400">✓</span>
					<span><strong>Google Sheets</strong> — Shows spreadsheet title</span>
				</li>
			</ul>
		</section>

		<section class="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
			<h2 class="text-lg font-medium mb-3">Troubleshooting</h2>
			<dl class="space-y-3 text-sm">
				<div>
					<dt class="font-medium text-red-400">"Google OAuth is not configured"</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Save the Client ID and Secret first before clicking Connect.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">Popup blocked</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Allow popups for localhost:5173 in your browser settings.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">"Access denied" or 403 error</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Add your email to Test Users in the OAuth consent screen.</dd>
				</div>
				<div>
					<dt class="font-medium text-red-400">Token expired</dt>
					<dd class="text-[var(--color-text-muted)] mt-1">Tokens auto-refresh. If issues persist, disconnect and reconnect.</dd>
				</div>
			</dl>
		</section>

		<section class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
			<h3 class="font-medium text-blue-200 mb-2">💡 Tip</h3>
			<p class="text-sm text-blue-100">
				You can create the OAuth app with a personal Google account, then authenticate with any account 
				(personal or work) during the Connect flow.
			</p>
		</section>
	</div>

	<div class="mt-8">
		<a href="/settings" class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors">
			Go to Settings →
		</a>
	</div>
</main>
