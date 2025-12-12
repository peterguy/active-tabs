import { db } from './db';
import { credentials } from './db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';
import { randomUUID } from 'crypto';

export type ServiceType = 'github' | 'slack' | 'linear' | 'notion';
export type CredentialType = 'pat' | 'oauth' | 'api_key';

export interface CredentialData {
	token: string;
	refreshToken?: string;
	expiresAt?: string;
}

export interface ServiceCredential {
	id: string;
	service: ServiceType;
	type: CredentialType;
	isConfigured: boolean;
	expiresAt: Date | null;
}

export async function saveCredential(
	service: ServiceType,
	type: CredentialType,
	data: CredentialData
): Promise<void> {
	const { encrypted, iv } = encrypt(JSON.stringify(data));
	const now = new Date();
	const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

	const existing = await db.query.credentials.findFirst({
		where: eq(credentials.service, service)
	});

	if (existing) {
		await db
			.update(credentials)
			.set({
				type,
				encryptedData: encrypted,
				iv,
				expiresAt,
				updatedAt: now
			})
			.where(eq(credentials.service, service));
	} else {
		await db.insert(credentials).values({
			id: randomUUID(),
			service,
			type,
			encryptedData: encrypted,
			iv,
			expiresAt,
			createdAt: now,
			updatedAt: now
		});
	}
}

export async function getCredential(service: ServiceType): Promise<CredentialData | null> {
	const cred = await db.query.credentials.findFirst({
		where: eq(credentials.service, service)
	});

	if (!cred) return null;

	try {
		const decrypted = decrypt(cred.encryptedData, cred.iv);
		return JSON.parse(decrypted) as CredentialData;
	} catch (error) {
		console.error(`Failed to decrypt credential for ${service}:`, error);
		return null;
	}
}

export async function deleteCredential(service: ServiceType): Promise<void> {
	await db.delete(credentials).where(eq(credentials.service, service));
}

export async function listCredentials(): Promise<ServiceCredential[]> {
	const all = await db.select().from(credentials);
	return all.map(c => ({
		id: c.id,
		service: c.service as ServiceType,
		type: c.type as CredentialType,
		isConfigured: true,
		expiresAt: c.expiresAt
	}));
}

export const SUPPORTED_SERVICES: { id: ServiceType; name: string; description: string; tokenUrl: string; tokenLabel: string }[] = [
	{
		id: 'github',
		name: 'GitHub',
		description: 'Access PRs, issues, and repositories',
		tokenUrl: 'https://github.com/settings/tokens/new?scopes=repo,read:user',
		tokenLabel: 'Personal Access Token'
	},
	{
		id: 'slack',
		name: 'Slack',
		description: 'Access messages and channels',
		tokenUrl: 'https://api.slack.com/apps',
		tokenLabel: 'Bot Token'
	},
	{
		id: 'linear',
		name: 'Linear',
		description: 'Access issues and projects',
		tokenUrl: 'https://linear.app/settings/api',
		tokenLabel: 'API Key'
	},
	{
		id: 'notion',
		name: 'Notion',
		description: 'Access pages and databases',
		tokenUrl: 'https://www.notion.so/my-integrations',
		tokenLabel: 'Integration Token'
	}
];
