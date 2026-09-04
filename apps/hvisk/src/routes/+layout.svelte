<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as stylex from '@stylexjs/stylex';
	import { uiStyles } from '@sendenv/web-ui';
	import '@sendenv/web-ui/global.css';

	import type { LayoutData } from './$types';
	import Header from '$lib/Header.svelte';

	let { children }: { children: Snippet; data: LayoutData } = $props();

	if (import.meta.env.DEV) {
		$effect(() => {
			void import('virtual:stylex:runtime');
		});
	}
</script>

<svelte:head>
	<meta
		name="description"
		content="Del sensitiv informasjon trygt med en kryptert lenke som bare virker én gang. Ingen konto nødvendig."
	/>
	<meta
		property="og:description"
		content="Del sensitiv informasjon trygt med en kryptert lenke som bare virker én gang. Ingen konto nødvendig."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Hvisk" />
	<meta property="og:locale" content="nb_NO" />
	<meta name="twitter:card" content="summary" />
	<meta
		name="twitter:description"
		content="Del sensitiv informasjon trygt med en kryptert lenke som bare virker én gang. Ingen konto nødvendig."
	/>
	<link rel="icon" href="/favicon.svg" />
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

<Header />
<main {...stylex.attrs(uiStyles.pageShell)}>{@render children()}</main>
