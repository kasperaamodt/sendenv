import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';

import { decrypt_secret, encrypt_secret, get_access_token } from './crypto.ts';
import { MAX_ENCRYPTED_SECRET_LENGTH } from './limits.ts';

describe('browser encryption', () => {
	test('matches the fixed v1 protocol vector', async () => {
		const content_id = '000102030405060708090a0b0c0d0e0f';
		const root_key = 'v1.AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8';
		const ciphertext = 'v1.AAECAwQFBgcICQoLAbDhZ8vFDGEBZR4I01UNkgCbmh_kk-fi097MztbZom4F7g';
		const access_token = await get_access_token(root_key);

		expect(access_token).toBe('ZffQFij5_g7TU2eOYMg6RsY2PADTWYveHPUywcFAF5g');
		expect(
			createHash('sha256').update(Buffer.from(access_token, 'base64url')).digest('base64url')
		).toBe('XyItQEh4jOF50YPCfnXiBrZgmNDrc95P6VTnk6lmz1Y');
		expect(await decrypt_secret(ciphertext, root_key, content_id)).toBe('sendenv-v1-fixture');
	});

	test('round-trips UTF-8 content using the v1 envelope', async () => {
		const plaintext = 'DATABASE_URL=mysql://user:påss@example.com/db\nAPI_KEY=secret';
		const encrypted = await encrypt_secret(plaintext);
		const access_token = await get_access_token(encrypted.rootKey);
		const expected_verifier = createHash('sha256')
			.update(Buffer.from(access_token, 'base64url'))
			.digest('base64url');

		expect(encrypted.version).toBe(1);
		expect(encrypted.contentId).toMatch(/^[a-f0-9]{32}$/);
		expect(encrypted.rootKey).toMatch(/^v1\.[A-Za-z0-9_-]{43}$/);
		expect(encrypted.ciphertext).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
		expect(encrypted.accessVerifier).toBe(expected_verifier);
		expect(access_token).not.toBe(encrypted.rootKey.slice(3));
		expect(await decrypt_secret(encrypted.ciphertext, encrypted.rootKey, encrypted.contentId)).toBe(
			plaintext
		);
	});

	test('keeps the maximum client-accepted secret within the stored payload limit', async () => {
		const at_limit = await encrypt_secret('a'.repeat(49_121));
		const over_limit = await encrypt_secret('a'.repeat(49_122));

		expect(at_limit.ciphertext).toHaveLength(MAX_ENCRYPTED_SECRET_LENGTH);
		expect(over_limit.ciphertext.length).toBeGreaterThan(MAX_ENCRYPTED_SECRET_LENGTH);
	});

	test('binds ciphertext to both its key and content ID', async () => {
		const encrypted = await encrypt_secret('secret');
		const other = await encrypt_secret('other');

		await expect(
			decrypt_secret(encrypted.ciphertext, other.rootKey, encrypted.contentId)
		).rejects.toThrow();
		await expect(
			decrypt_secret(encrypted.ciphertext, encrypted.rootKey, other.contentId)
		).rejects.toThrow();
	});
});
