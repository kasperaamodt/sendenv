<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	const props: Omit<HTMLInputAttributes, 'class'> = $props();
</script>

<input {...props} class="w-full rounded-md border border-gray-200 p-2" />
