<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		children: Snippet;
	};

	const { class: className, children, ...rest }: Props = $props();

	const baseStyles =
		'flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

	const combinedStyles = cn(baseStyles, className ?? '');
</script>

<button class={combinedStyles} {...rest}>
	{@render children()}
</button>
