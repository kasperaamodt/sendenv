<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { SecretViewer, uiStyles } from '@sendenv/web-ui';
	import { resolve } from '$app/paths';

	import type { PageData } from './$types';
	import { secret_viewer_messages } from '$lib/messages';

	let { data }: { data: PageData } = $props();
	const title = $derived(
		data.status === 'available'
			? 'Someone shared a secret with you - Sendenv'
			: 'Secret link unavailable - Sendenv'
	);
	const unavailable_message = $derived(
		data.status === 'consumed' ? 'This link has already been used.' : 'This link has expired.'
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
		<h1 {...stylex.attrs(uiStyles.heading)}>Someone shared a secret with you</h1>
		<p {...stylex.attrs(uiStyles.lede)}>
			This secret can only be revealed once. Select Reveal secret when you are ready, then save any
			information you need before closing this page.
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
					Create a new secret
				</a>
			</div>
		</section>
	{/if}
</div>
