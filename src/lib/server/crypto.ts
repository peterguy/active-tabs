import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Uint8Array {
	const secret = process.env.ENCRYPTION_SECRET || 'active-tabs-default-secret-change-me';
	const key = scryptSync(secret, 'salt', KEY_LENGTH);
	return new Uint8Array(key.buffer, key.byteOffset, key.byteLength);
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
	const key = getEncryptionKey();
	const ivBuffer = randomBytes(IV_LENGTH);
	const iv = new Uint8Array(ivBuffer.buffer, ivBuffer.byteOffset, ivBuffer.byteLength);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	
	let encrypted = cipher.update(plaintext, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	
	const authTag = cipher.getAuthTag();
	const encryptedBytes = Buffer.from(encrypted, 'base64');
	const combined = new Uint8Array(encryptedBytes.length + authTag.length);
	combined.set(new Uint8Array(encryptedBytes.buffer, encryptedBytes.byteOffset, encryptedBytes.byteLength));
	combined.set(new Uint8Array(authTag.buffer, authTag.byteOffset, authTag.byteLength), encryptedBytes.length);
	
	return {
		encrypted: Buffer.from(combined).toString('base64'),
		iv: ivBuffer.toString('base64')
	};
}

export function decrypt(encryptedData: string, ivBase64: string): string {
	const key = getEncryptionKey();
	const ivBuffer = Buffer.from(ivBase64, 'base64');
	const iv = new Uint8Array(ivBuffer.buffer, ivBuffer.byteOffset, ivBuffer.byteLength);
	const encryptedBuffer = Buffer.from(encryptedData, 'base64');
	
	const authTag = new Uint8Array(encryptedBuffer.buffer, encryptedBuffer.byteOffset + encryptedBuffer.length - AUTH_TAG_LENGTH, AUTH_TAG_LENGTH);
	const encrypted = new Uint8Array(encryptedBuffer.buffer, encryptedBuffer.byteOffset, encryptedBuffer.length - AUTH_TAG_LENGTH);
	
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	
	const decrypted1 = decipher.update(encrypted);
	const decrypted2 = decipher.final();
	const result = new Uint8Array(decrypted1.length + decrypted2.length);
	result.set(new Uint8Array(decrypted1.buffer, decrypted1.byteOffset, decrypted1.byteLength));
	result.set(new Uint8Array(decrypted2.buffer, decrypted2.byteOffset, decrypted2.byteLength), decrypted1.length);
	
	return Buffer.from(result).toString('utf8');
}
