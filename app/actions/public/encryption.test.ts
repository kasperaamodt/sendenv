import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';

import { decrypt_content, encrypt_content, get_access_token } from './encryption.ts';

describe('browser encryption', () => {
	test('matches the fixed v2 protocol vector', async () => {
		const id = '000102030405060708090a0b0c0d0e0f';
		const key = 'v2.AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
		const encryptedData = 'v2.AAECAwQFBgcICQoL2IrA85LRL029XQvSZaOmSyv6Q2TZ8pOBqAX3W2w279vARQ';
		const accessToken = await get_access_token(key);

		expect(accessToken).toBe('BrT8WYaTx3-Eiqjt7SbS2UwtRoK3RDALpzKY56K0Pzg');
		expect(
			createHash('sha256').update(Buffer.from(accessToken, 'base64url')).digest('base64url')
		).toBe('0vYwDc1e8qurFUNjdfXLG0dAGR8aJ32lDXbwq6SvsIw');
		expect(await decrypt_content(encryptedData, key, id)).toBe('sendenv-v2-fixture');
	});

	test('round-trips UTF-8 content using the v2 envelope', async () => {
		const plaintext = 'DATABASE_URL=mysql://user:påss@example.com/db\nAPI_KEY=secret';
		const encrypted = await encrypt_content(plaintext);
		const accessToken = await get_access_token(encrypted.key);
		const expectedVerifier = createHash('sha256')
			.update(Buffer.from(accessToken, 'base64url'))
			.digest('base64url');

		expect(encrypted.version).toBe(2);
		expect(encrypted.id).toMatch(/^[a-f0-9]{32}$/);
		expect(encrypted.key).toMatch(/^v2\.[A-Za-z0-9_-]{43}$/);
		expect(encrypted.encrypted_data).toMatch(/^v2\.[A-Za-z0-9_-]+$/);
		expect(encrypted.access_verifier).toBe(expectedVerifier);
		expect(accessToken).not.toBe(encrypted.key.slice(3));
		expect(await decrypt_content(encrypted.encrypted_data, encrypted.key, encrypted.id)).toBe(
			plaintext
		);
	});

	test('binds ciphertext to both its key and content ID', async () => {
		const encrypted = await encrypt_content('secret');
		const other = await encrypt_content('other');

		await expect(
			decrypt_content(encrypted.encrypted_data, other.key, encrypted.id)
		).rejects.toThrow();
		await expect(
			decrypt_content(encrypted.encrypted_data, encrypted.key, other.id)
		).rejects.toThrow();
	});
});
