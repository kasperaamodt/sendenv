export const MAX_ENCRYPTED_SECRET_LENGTH = 65_535;
export const SECRET_TOO_LARGE_MESSAGE = 'Secret is too large. Shorten it and try again.';

// The v2 envelope adds a 12-byte IV and 16-byte authentication tag before base64url encoding.
export const MAX_SECRET_BYTES = 49_121;

export function getSecretByteLength(secret: string): number {
	return new TextEncoder().encode(secret).byteLength;
}

export function isSecretTooLarge(secret: string): boolean {
	return getSecretByteLength(secret) > MAX_SECRET_BYTES;
}
