export const secret_headers = {
	'Cache-Control': 'no-store',
	'X-Robots-Tag': 'noindex, nofollow, noarchive'
};

export function is_secret_path(pathname: string): boolean {
	return /^\/s\/[^/]+$/.test(pathname);
}
