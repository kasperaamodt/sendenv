<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { SecretViewer, uiStyles } from '@sendenv/web-ui';
	import { resolve } from '$app/paths';

	import type { PageData } from './$types';
	import { secret_viewer_messages } from '$lib/messages';

	let { data }: { data: PageData } = $props();
	const title = $derived(
		data.status === 'available'
			? 'Noen har delt noe privat med deg – Hvisk'
			: 'Lenken er utilgjengelig – Hvisk'
	);
	const unavailable_message = $derived(
		data.status === 'consumed' ? 'Denne lenken er allerede brukt.' : 'Denne lenken er utløpt.'
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta property="og:title" content={title} />
	<meta name="twitter:title" content={title} />
	<meta name="robots" content="noindex" />
</svelte:head>

<div {...stylex.attrs(uiStyles.stack)}>
	<section>
		<h1 {...stylex.attrs(uiStyles.heading)}>Noen har delt noe privat med deg</h1>
		<p {...stylex.attrs(uiStyles.lede)}>
			Innholdet kan bare vises én gang. Trykk Vis innholdet når du er klar, og ta vare på det du
			trenger før du lukker siden.
		</p>
	</section>

	{#if data.status === 'available'}
		<SecretViewer
			apiBaseUrl={data.apiBaseUrl}
			contentId={data.contentId}
			messages={secret_viewer_messages}
		/>
	{:else}
		<section {...stylex.attrs(uiStyles.emptyState)}>
			<p {...stylex.attrs(uiStyles.error)} role="alert">{unavailable_message}</p>
			<div {...stylex.attrs(uiStyles.actions)}>
				<a
					href={resolve('/')}
					{...stylex.attrs(uiStyles.button, uiStyles.buttonSecondary, uiStyles.focusVisible)}
				>
					Del noe nytt
				</a>
			</div>
		</section>
	{/if}
</div>
