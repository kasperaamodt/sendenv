<script lang="ts">
	import Header from '$components/header.svelte';
	import '../app.css';
	import '../fixes.css';

	let { children } = $props();
</script>

<head:svelte>
	<title>Send env</title>
	<meta
		name="description"
		content="Securely share sensitive info with Send env. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</head:svelte>

<Header />
<div class="mx-auto mt-2 max-w-3xl p-4">
	{@render children()}
</div>
