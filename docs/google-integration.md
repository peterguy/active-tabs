# Google Integration Setup Guide

This guide walks you through setting up Google integration in Active Tabs to fetch metadata and summaries from Google Docs and Sheets.

## Prerequisites
- A Google account (personal or work)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click the project dropdown (top left) → **New Project**
3. Name your project (e.g., "Active Tabs") and click **Create**
4. Wait for the project to be created, then select it

## Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Docs API**
   - **Google Sheets API**
   - **Google Drive API**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Click **Create**
4. Fill in required fields:
   - App name: "Active Tabs"
   - User support email: Your email
   - Developer contact: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
   - `https://www.googleapis.com/auth/documents.readonly`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
7. Click **Save and Continue**
8. On **Test users** page, add your email address
9. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Active Tabs"
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173/api/auth/google/callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Active Tabs

1. Open Active Tabs and go to **Settings**
2. Find **Google** in the Connected Services list
3. Click **Configure**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save Configuration**

## Step 6: Connect Your Google Account

1. After saving the config, click **Connect with Google**
2. A popup will open for Google authentication
3. Select your Google account and grant permissions
4. The popup will show "Connected successfully!" and auto-close
5. The Settings page will refresh showing Google as connected

## What Works

- **Google Docs** (`docs.google.com/document/d/...`) → Shows document title, generates LLM summaries
- **Google Sheets** (`docs.google.com/spreadsheets/d/...`) → Shows spreadsheet title, generates LLM summaries

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Google OAuth is not configured" | Make sure you saved the Client ID and Secret first |
| Popup blocked | Allow popups for localhost:5173 |
| "Access denied" | Add your email to Test Users in OAuth consent screen |
| Token expired | Tokens auto-refresh. If issues persist, disconnect and reconnect |

## Notes

- Tokens are stored encrypted locally and auto-refresh when expired
- You can use a personal Google account to create the OAuth app, then authenticate with any account (personal or work)
