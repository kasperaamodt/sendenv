<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { uiStyles } from '@sendenv/web-ui';
	import { resolve } from '$app/paths';

	let { apiBaseUrl }: { apiBaseUrl: string } = $props();
</script>

<header {...stylex.attrs(uiStyles.siteHeader)}>
	<a
		href={resolve('/')}
		aria-label="Sendenv home"
		{...stylex.attrs(uiStyles.logoLink, uiStyles.focusVisible)}
	>
		<img src="/logo.svg" alt="" width="127" height="30" {...stylex.attrs(uiStyles.logo)} />
	</a>

	<nav aria-label="Primary navigation" {...stylex.attrs(uiStyles.siteNav)}>
		<a
			href={`${apiBaseUrl}/openapi`}
			rel="external"
			{...stylex.attrs(uiStyles.navLink, uiStyles.focusVisible)}
		>
			API docs
		</a>
		<a
			href="https://twitter.com/kasperaamodt"
			target="_blank"
			rel="noreferrer"
			aria-label="Kasper Aamodt on Twitter"
			{...stylex.attrs(uiStyles.iconLink, uiStyles.focusVisible)}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				aria-hidden="true"
				{...stylex.attrs(uiStyles.navIcon)}
			>
				<path
					d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
				></path>
			</svg>
		</a>
		<a
			href="https://github.com/kasperaamodt/sendenv"
			target="_blank"
			rel="noreferrer"
			aria-label="Sendenv on GitHub"
			{...stylex.attrs(uiStyles.iconLink, uiStyles.focusVisible)}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				aria-hidden="true"
				{...stylex.attrs(uiStyles.navIcon)}
			>
				<path
					d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
				></path>
				<path d="M9 18c-4.51 2-5-2-7-2"></path>
			</svg>
		</a>
	</nav>
</header>
