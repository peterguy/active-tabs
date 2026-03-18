# Slack Integration Setup Guide

This guide walks you through setting up Slack integration in Active Tabs to fetch metadata from Slack channels and messages.

## Prerequisites

- A Slack workspace where you have permission to create apps

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click **Create New App**
3. Choose **From scratch**
4. Name your app (e.g., "Active Tabs") and select your workspace
5. Click **Create App**

## Step 2: Configure OAuth Scopes

1. In the left sidebar, click **OAuth & Permissions**
2. Scroll to **User Token Scopes** and add:
   - `channels:read` - View basic info about public channels
   - `channels:history` - View messages in public channels
   - `groups:read` - View basic info about private channels (optional)
   - `groups:history` - View messages in private channels (optional)

> **Important:** Use **User Token Scopes**, not Bot Token Scopes. The User OAuth Token can read messages from any public channel you have access to without the bot needing to be added to each channel.

## Step 3: Install the App

1. Scroll to the top of the **OAuth & Permissions** page
2. Click **Install to Workspace**
3. Review the permissions and click **Allow**

## Step 4: Copy the User OAuth Token

1. After installation, you'll see **OAuth Tokens for Your Workspace**
2. Copy the **User OAuth Token** (starts with `xoxp-`)

> **Important:** Use the User token, NOT the Bot User OAuth Token.

## Step 5: Add Token to Active Tabs

1. Open Active Tabs and go to **Settings**
2. Find **Slack** in the Connected Services list
3. Click **Connect** and paste your User OAuth Token
4. Click **Save Token**

## What Works

| Link Type | Example | Result |
|-----------|---------|--------|
| Channel links | `slack.com/archives/C12345678` | Shows channel name and description |
| Message links | `slack.com/archives/C12345678/p1234567890` | Shows message preview with channel name |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "not_in_channel" error | You're using a Bot token. Switch to the User OAuth Token |
| No message preview | Make sure the URL contains `/p` followed by the message timestamp |
