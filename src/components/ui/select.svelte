<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	const {
		children,
		...props
	}: {
		children: Snippet;
	} & Omit<HTMLSelectAttributes, 'class'> = $props();
</script>

<select
	{...props}
	class="rounded-md border border-gray-200 bg-white p-2 focus:ring-2 focus:ring-black focus:ring-offset-1 focus:outline-none"
>
	{@render children()}
</select>
