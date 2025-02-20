<script lang="ts">
	import Header from '$components/header.svelte';
	import '../app.css';
	import '../fixes.css';

	let { children } = $props();
</script>

<head:svelte>
	<title>Sendenv</title>
	<meta
		name="description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta name="og:title" content="Sendenv" />
	<meta
		name="og:description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta name="og:image" content="https://sendenv.app/og.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sendenv" />
	<meta
		name="twitter:description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta name="twitter:image" content="https://sendenv.app/og.png" />
	<meta name="twitter:image:alt" content="Sendenv logo" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sendenv.app" />
	<meta property="og:site_name" content="Sendenv" />
</head:svelte>

<Header />
<div class="mx-auto mt-2 max-w-3xl p-4">
	{@render children()}
</div>
