<script lang="ts">
	import Header from '$components/header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<Header />
<div class="mx-auto max-w-3xl p-4">
	{@render children()}
</div>
