<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		variant?: keyof typeof variants;
		children: Snippet;
	};

	const { class: className, variant = 'primary', children, ...rest }: Props = $props();

	const baseStyles =
		'flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

	const variants = {
		primary: 'border border-transparent bg-black text-white hover:bg-gray-800',
		secondary: 'border border-transparent bg-gray-100 text-black hover:bg-gray-200',
		outline: 'border border-black text-black hover:bg-gray-100',
		ghost: 'border border-transparent bg-transparent text-black hover:bg-gray-100',
		danger: 'border border-transparent bg-red-500 text-white hover:bg-red-600'
	};

	const combinedStyles = cn(baseStyles, variants[variant], className ?? '');
</script>

<button class={combinedStyles} {...rest}>
	{@render children()}
</button>
