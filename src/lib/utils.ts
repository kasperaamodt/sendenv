import type { ClassValue } from 'svelte/elements';

export function cn(...classes: ClassValue[]) {
	return classes.filter(Boolean).join(' ');
}
