<script lang="ts">
	import Header from '$components/header.svelte';
	import '../app.css';
	import '../fixes.css';

	let { children } = $props();
</script>

<Header />
<div class="mx-auto mt-2 max-w-3xl p-4">
	{@render children()}
</div>
