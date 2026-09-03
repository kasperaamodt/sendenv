export const MAX_ENCRYPTED_SECRET_LENGTH = 65_535;
export const MAX_SECRET_BYTES = 49_121;

export function get_secret_byte_length(secret: string): number {
	return new TextEncoder().encode(secret).byteLength;
}

export function is_secret_too_large(secret: string): boolean {
	return get_secret_byte_length(secret) > MAX_SECRET_BYTES;
}
