import { PROTOCOL_VERSION } from './contracts.js';

const V1_PREFIX = 'v1.';
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ID_PATTERN = /^[a-f0-9]{32}$/;
const encoder = new TextEncoder();
const hkdf_salt = encoder.encode('sendenv:v1');
const encryption_info = encoder.encode('sendenv:v1:encryption');
const access_info = encoder.encode('sendenv:v1:access');

export async function encrypt_secret(content: string): Promise<{
	version: typeof PROTOCOL_VERSION;
	ciphertext: string;
	accessVerifier: string;
	rootKey: string;
	contentId: string;
}> {
	const root_key = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const content_id = to_hex(crypto.getRandomValues(new Uint8Array(16)));
	const { access_token, encryption_key } = await derive_v1_keys(root_key, ['encrypt']);
	const content_bytes = encoder.encode(content);
	const encrypted_bytes = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: get_additional_data(content_id) },
		encryption_key,
		content_bytes
	);
	const combined = new Uint8Array(iv.length + encrypted_bytes.byteLength);

	combined.set(iv);
	combined.set(new Uint8Array(encrypted_bytes), iv.length);

	return {
		version: PROTOCOL_VERSION,
		ciphertext: `${V1_PREFIX}${base64_url_encode(combined)}`,
		accessVerifier: base64_url_encode(
			new Uint8Array(await crypto.subtle.digest('SHA-256', access_token))
		),
		rootKey: `${V1_PREFIX}${base64_url_encode(root_key)}`,
		contentId: content_id
	};
}

export async function decrypt_secret(
	ciphertext: string,
	root_key_fragment: string,
	content_id: string
): Promise<string> {
	if (
		!ID_PATTERN.test(content_id) ||
		!root_key_fragment.startsWith(V1_PREFIX) ||
		!ciphertext.startsWith(V1_PREFIX)
	) {
		throw new Error('Invalid secret');
	}

	const root_key = decode_key(root_key_fragment.slice(V1_PREFIX.length));
	const { encryption_key } = await derive_v1_keys(root_key, ['decrypt']);

	return decrypt_aes_gcm(
		ciphertext.slice(V1_PREFIX.length),
		encryption_key,
		get_additional_data(content_id)
	);
}

export async function get_access_token(root_key_fragment: string): Promise<string> {
	if (!is_valid_key_fragment(root_key_fragment)) throw new Error('Invalid encryption key');
	const root_key = decode_key(root_key_fragment.slice(V1_PREFIX.length));
	const { access_token } = await derive_v1_keys(root_key, ['decrypt']);
	return base64_url_encode(access_token);
}

export function is_valid_key_fragment(root_key_fragment: string): boolean {
	return (
		root_key_fragment.startsWith(V1_PREFIX) &&
		KEY_PATTERN.test(root_key_fragment.slice(V1_PREFIX.length))
	);
}

async function derive_v1_keys(
	root_key_bytes: Uint8Array<ArrayBuffer>,
	key_usages: KeyUsage[]
): Promise<{ access_token: Uint8Array<ArrayBuffer>; encryption_key: CryptoKey }> {
	const root_key = await crypto.subtle.importKey('raw', root_key_bytes, 'HKDF', false, [
		'deriveBits',
		'deriveKey'
	]);
	const [access_token, encryption_key] = await Promise.all([
		crypto.subtle.deriveBits(
			{ name: 'HKDF', hash: 'SHA-256', salt: hkdf_salt, info: access_info },
			root_key,
			256
		),
		crypto.subtle.deriveKey(
			{ name: 'HKDF', hash: 'SHA-256', salt: hkdf_salt, info: encryption_info },
			root_key,
			{ name: 'AES-GCM', length: 256 },
			false,
			key_usages
		)
	]);

	return { access_token: new Uint8Array(access_token), encryption_key };
}

async function decrypt_aes_gcm(
	payload: string,
	crypto_key: CryptoKey,
	additional_data: Uint8Array<ArrayBuffer>
): Promise<string> {
	const combined = base64_url_decode(payload);
	if (combined.length < 28) throw new Error('Invalid encrypted payload');

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);
	const decrypted = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv, additionalData: additional_data },
		crypto_key,
		ciphertext
	);

	return new TextDecoder().decode(decrypted);
}

function get_additional_data(content_id: string): Uint8Array<ArrayBuffer> {
	return encoder.encode(`sendenv:v1:${content_id}`);
}

function decode_key(value: string): Uint8Array<ArrayBuffer> {
	if (!KEY_PATTERN.test(value)) throw new Error('Invalid encryption key');

	const key = base64_url_decode(value);
	if (key.length !== 32) throw new Error('Invalid encryption key');
	return key;
}

function to_hex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64_url_encode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64_url_decode(value: string): Uint8Array<ArrayBuffer> {
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
