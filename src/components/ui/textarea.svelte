<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	const props: Omit<HTMLTextareaAttributes, 'class'> = $props();
</script>

<textarea {...props} class="w-full rounded-md border border-gray-200 p-2"></textarea>
