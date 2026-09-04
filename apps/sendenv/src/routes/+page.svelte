<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { CreateSecret, uiStyles } from '@sendenv/web-ui';

	import type { PageData } from './$types';
	import { create_secret_messages } from '$lib/messages';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Sendenv - Securely share secrets with anyone</title>
	<meta property="og:title" content="Sendenv - Securely share secrets with anyone" />
	<meta name="twitter:title" content="Sendenv - Securely share secrets with anyone" />
</svelte:head>

<div {...stylex.attrs(uiStyles.stack)}>
	<section>
		<h1 {...stylex.attrs(uiStyles.heading)}>Securely share secrets with anyone</h1>
		<p {...stylex.attrs(uiStyles.lede)}>
			Your secrets are encrypted in your browser. Only the recipient with the correct link can read
			them. Even we cannot read your secrets. Links expire after 1 hour by default and can only be
			used once.
		</p>
	</section>

	<CreateSecret apiBaseUrl={data.apiBaseUrl} messages={create_secret_messages} />
</div>
