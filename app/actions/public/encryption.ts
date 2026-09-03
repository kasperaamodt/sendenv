const V2_PREFIX = 'v2.';
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ID_PATTERN = /^[a-f0-9]{32}$/;
const encoder = new TextEncoder();
const hkdfSalt = encoder.encode('sendenv:v2');
const encryptionInfo = encoder.encode('sendenv:v2:encryption');
const accessInfo = encoder.encode('sendenv:v2:access');

export async function encrypt_content(content: string): Promise<{
	version: 2;
	encrypted_data: string;
	access_verifier: string;
	key: string;
	id: string;
}> {
	const rootKey = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const id = toHex(crypto.getRandomValues(new Uint8Array(16)));
	const { accessToken, encryptionKey } = await deriveV2Keys(rootKey, ['encrypt']);
	const contentBytes = encoder.encode(content);
	const encryptedBytes = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: getAdditionalData(id) },
		encryptionKey,
		contentBytes
	);
	const combined = new Uint8Array(iv.length + encryptedBytes.byteLength);

	combined.set(iv);
	combined.set(new Uint8Array(encryptedBytes), iv.length);

	return {
		version: 2,
		encrypted_data: `${V2_PREFIX}${base64UrlEncode(combined)}`,
		access_verifier: base64UrlEncode(
			new Uint8Array(await crypto.subtle.digest('SHA-256', accessToken))
		),
		key: `${V2_PREFIX}${base64UrlEncode(rootKey)}`,
		id
	};
}

export async function decrypt_content(
	encryptedData: string,
	keyFragment: string,
	contentId: string
): Promise<string> {
	if (
		!ID_PATTERN.test(contentId) ||
		!keyFragment.startsWith(V2_PREFIX) ||
		!encryptedData.startsWith(V2_PREFIX)
	) {
		throw new Error('Invalid secret');
	}

	const rootKey = decodeKey(keyFragment.slice(V2_PREFIX.length));
	const { encryptionKey } = await deriveV2Keys(rootKey, ['decrypt']);

	return decryptAesGcm(
		encryptedData.slice(V2_PREFIX.length),
		encryptionKey,
		getAdditionalData(contentId)
	);
}

export async function get_access_token(keyFragment: string): Promise<string> {
	if (!is_valid_key_fragment(keyFragment)) throw new Error('Invalid encryption key');
	const rootKey = decodeKey(keyFragment.slice(V2_PREFIX.length));
	const { accessToken } = await deriveV2Keys(rootKey, ['decrypt']);
	return base64UrlEncode(accessToken);
}

export function is_valid_key_fragment(keyFragment: string): boolean {
	return keyFragment.startsWith(V2_PREFIX) && KEY_PATTERN.test(keyFragment.slice(V2_PREFIX.length));
}

async function deriveV2Keys(
	rootKeyBytes: Uint8Array<ArrayBuffer>,
	keyUsages: KeyUsage[]
): Promise<{ accessToken: Uint8Array<ArrayBuffer>; encryptionKey: CryptoKey }> {
	const rootKey = await crypto.subtle.importKey('raw', rootKeyBytes, 'HKDF', false, [
		'deriveBits',
		'deriveKey'
	]);
	const [accessToken, encryptionKey] = await Promise.all([
		crypto.subtle.deriveBits(
			{ name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: accessInfo },
			rootKey,
			256
		),
		crypto.subtle.deriveKey(
			{ name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: encryptionInfo },
			rootKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			keyUsages
		)
	]);

	return { accessToken: new Uint8Array(accessToken), encryptionKey };
}

async function decryptAesGcm(
	payload: string,
	cryptoKey: CryptoKey,
	additionalData: Uint8Array<ArrayBuffer>
): Promise<string> {
	const combined = base64UrlDecode(payload);
	if (combined.length < 28) throw new Error('Invalid encrypted payload');

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);
	const decrypted = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv, additionalData },
		cryptoKey,
		ciphertext
	);

	return new TextDecoder().decode(decrypted);
}

function getAdditionalData(contentId: string): Uint8Array<ArrayBuffer> {
	return encoder.encode(`sendenv:v2:${contentId}`);
}

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
	if (!KEY_PATTERN.test(value)) throw new Error('Invalid encryption key');

	const key = base64UrlDecode(value);
	if (key.length !== 32) throw new Error('Invalid encryption key');
	return key;
}

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
	if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
		throw new Error('Invalid base64url value');
	}

	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}
