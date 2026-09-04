<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { uiStyles } from '@sendenv/web-ui';
	import { resolve } from '$app/paths';
</script>

<header {...stylex.attrs(uiStyles.siteHeader)}>
	<a
		href={resolve('/')}
		aria-label="Hvisk – gå til forsiden"
		{...stylex.attrs(uiStyles.logoLink, uiStyles.focusVisible)}
	>
		<img src="/logo.svg" alt="" width="88" height="30" {...stylex.attrs(uiStyles.logo)} />
	</a>
</header>
