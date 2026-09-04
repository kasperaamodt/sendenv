<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as stylex from '@stylexjs/stylex';
	import { uiStyles } from '@sendenv/web-ui';
	import '@sendenv/web-ui/global.css';

	import type { LayoutData } from './$types';
	import Header from '$lib/Header.svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	if (import.meta.env.DEV) {
		$effect(() => {
			void import('virtual:stylex:runtime');
		});
	}
</script>

<svelte:head>
	<meta
		name="description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta
		property="og:description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta property="og:image" content="https://sendenv.app/og.png" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Sendenv" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:description"
		content="Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets."
	/>
	<meta name="twitter:image" content="https://sendenv.app/og.png" />
	<meta name="twitter:image:alt" content="Sendenv logo" />
	<link rel="icon" href="/favicon.ico" />
	<link
		rel="preload"
		href="/gilroy-semibold.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	{#if import.meta.env.DEV}
		<link rel="stylesheet" href="/virtual:stylex.css" />
	{/if}
</svelte:head>

<Header apiBaseUrl={data.apiBaseUrl} />
<main {...stylex.attrs(uiStyles.pageShell)}>{@render children()}</main>
