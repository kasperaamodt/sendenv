import { describe, expect, test } from 'bun:test';

import { is_secret_too_large } from './limits.ts';

describe('secret size', () => {
	test('measures the UTF-8 byte length before encryption', () => {
		const four_byte_character = String.fromCodePoint(0x1f600);

		expect(is_secret_too_large('a'.repeat(49_121))).toBe(false);
		expect(is_secret_too_large('a'.repeat(49_122))).toBe(true);
		expect(is_secret_too_large(four_byte_character.repeat(12_280))).toBe(false);
		expect(is_secret_too_large(four_byte_character.repeat(12_280) + 'aa')).toBe(true);
	});
});
