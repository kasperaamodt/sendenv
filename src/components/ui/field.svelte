<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		className?: string;
		children: Snippet;
	}

	const { className, children }: Props = $props();
</script>

<div class={cn('space-y-2', className ?? '')}>
	{@render children()}
</div>
