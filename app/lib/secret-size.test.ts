import { describe, expect, test } from 'bun:test';

import { isSecretTooLarge } from './secret-size.ts';

describe('secret size', () => {
	test('measures the UTF-8 byte length before encryption', () => {
		const fourByteCharacter = String.fromCodePoint(0x1f600);

		expect(isSecretTooLarge('a'.repeat(49_121))).toBe(false);
		expect(isSecretTooLarge('a'.repeat(49_122))).toBe(true);
		expect(isSecretTooLarge(fourByteCharacter.repeat(12_280))).toBe(false);
		expect(isSecretTooLarge(fourByteCharacter.repeat(12_280) + 'aa')).toBe(true);
	});
});
