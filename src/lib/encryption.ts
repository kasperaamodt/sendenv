export async function encrypt_content(content: string): Promise<{
	encrypted_data: string;
	key: string;
	id: string;
}> {
	const key = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const crypto_key = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);

	const contentBytes = new TextEncoder().encode(content);

	const encrypted_bytes = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv
		},
		crypto_key,
		contentBytes
	);

	const combined = new Uint8Array(iv.length + new Uint8Array(encrypted_bytes).length);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted_bytes), iv.length);

	const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

	return {
		encrypted_data: base64UrlEncode(combined),
		key: base64UrlEncode(key),
		id
	};
}

export async function decrypt_content(encrypted_data: string, key_str: string): Promise<string> {
	const combined = base64UrlDecode(encrypted_data);
	const key = base64UrlDecode(key_str);

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);

	const crypto_key = await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);

	const decrypted = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv
		},
		crypto_key,
		ciphertext
	);

	return new TextDecoder().decode(decrypted);
}

function base64UrlEncode(arr: Uint8Array): string {
	return btoa(String.fromCharCode(...arr))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return new Uint8Array(
		atob(str)
			.split('')
			.map((c) => c.charCodeAt(0))
	);
}
