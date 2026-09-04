<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { CreateSecret, uiStyles } from '@sendenv/web-ui';

	import type { PageData } from './$types';
	import { create_secret_messages } from '$lib/messages';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Hvisk – del privat informasjon trygt</title>
	<meta property="og:title" content="Hvisk – del privat informasjon trygt" />
	<meta name="twitter:title" content="Hvisk – del privat informasjon trygt" />
</svelte:head>

<div {...stylex.attrs(uiStyles.stack)}>
	<section>
		<h1 {...stylex.attrs(uiStyles.heading)}>Del privat informasjon trygt</h1>
		<p {...stylex.attrs(uiStyles.lede)}>
			Det du deler krypteres før det sendes. Bare den som får lenken kan lese det. Vi kan heller
			ikke lese innholdet. Lenken kan bare brukes én gang og utløper automatisk.
		</p>
	</section>

	<CreateSecret apiBaseUrl={data.apiBaseUrl} messages={create_secret_messages} />
</div>
