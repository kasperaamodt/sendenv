<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<label class="block text-sm font-medium text-gray-700">
	{@render children()}
</label>
