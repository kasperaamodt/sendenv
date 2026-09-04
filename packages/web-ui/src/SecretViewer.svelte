<script lang="ts">
	import * as stylex from '@stylexjs/stylex';
	import { tick } from 'svelte';

	import {
		ApiError,
		create_api_client,
		decrypt_secret,
		get_access_token,
		is_valid_key_fragment
	} from '@sendenv/sdk';

	import type { SecretViewerMessages } from './messages';
	import { uiStyles } from './styles';

	interface Props {
		apiBaseUrl: string;
		contentId: string;
		messages: SecretViewerMessages;
	}

	const INVALID_LINK = 'INVALID_LINK';
	let { apiBaseUrl, contentId, messages }: Props = $props();
	const api = $derived(create_api_client(apiBaseUrl));
	let copied = $state(false);
	let data = $state<string | null>(null);
	let error = $state<string | null>(null);
	let unavailable = $state(false);
	let loading = $state(false);

	async function reveal_secret() {
		if (unavailable || loading || data) return;

		error = null;
		loading = true;
		await tick();

		try {
			const root_key = window.location.hash.slice(1);
			if (!is_valid_key_fragment(root_key)) throw new Error(INVALID_LINK);
			const access_token = await get_access_token(root_key);
			const payload = await api.consume_secret(contentId, access_token);

			data = await decrypt_secret(payload.ciphertext, root_key, contentId);
		} catch (cause) {
			error = consume_error_message(cause, messages);
			unavailable =
				(cause instanceof Error && cause.message === INVALID_LINK) ||
				(cause instanceof ApiError && cause.code === 'SECRET_NOT_FOUND');
		} finally {
			loading = false;
		}
	}

	async function copy_secret() {
		if (!data) return;

		try {
			await navigator.clipboard.writeText(data);
			copied = true;
			error = null;
		} catch {
			error = messages.copy_failed;
		}
	}

	function consume_error_message(cause: unknown, copy: SecretViewerMessages): string {
		if (cause instanceof Error && cause.message === INVALID_LINK) return copy.invalid_link;
		if (cause instanceof ApiError && cause.code === 'SECRET_NOT_FOUND') return copy.not_found;
		if (cause instanceof ApiError && cause.code === 'RATE_LIMITED') return copy.rate_limited;
		return copy.generic_error;
	}
</script>

{#if unavailable}
	<section {...stylex.attrs(uiStyles.emptyState)} aria-live="polite">
		<p {...stylex.attrs(uiStyles.error)} role="alert">{error}</p>
		<div {...stylex.attrs(uiStyles.actions)}>
			<a
				href="/"
				{...stylex.attrs(uiStyles.button, uiStyles.buttonSecondary, uiStyles.focusVisible)}
			>
				{messages.new_secret}
			</a>
		</div>
	</section>
{:else}
	<section {...stylex.attrs(uiStyles.stackSmall)} aria-live="polite">
		<div {...stylex.attrs(uiStyles.field)}>
			<label for="secret-output" {...stylex.attrs(uiStyles.fieldLabel)}>
				{messages.output_label}
			</label>
			<div
				{...stylex.attrs(uiStyles.secretOutput, data === null && uiStyles.secretOutputConcealed)}
			>
				<textarea
					id="secret-output"
					rows="10"
					readonly
					value={data ?? ''}
					{...stylex.attrs(
						uiStyles.control,
						uiStyles.textArea,
						uiStyles.outputTextArea,
						uiStyles.focus
					)}></textarea>
				{#if data === null}
					<div {...stylex.attrs(uiStyles.revealOverlay)}>
						<button
							type="button"
							disabled={loading}
							{...stylex.attrs(uiStyles.button, uiStyles.buttonPrimary, uiStyles.focusVisible)}
							onclick={reveal_secret}
						>
							{loading ? messages.loading : messages.reveal_secret}
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if error}
			<p {...stylex.attrs(uiStyles.error)} role="alert">{error}</p>
		{/if}

		<div {...stylex.attrs(uiStyles.actions, uiStyles.secretActions)}>
			<a
				href="/"
				{...stylex.attrs(uiStyles.button, uiStyles.buttonSecondary, uiStyles.focusVisible)}
			>
				{messages.new_secret}
			</a>
			<button
				type="button"
				disabled={!data}
				{...stylex.attrs(uiStyles.button, uiStyles.buttonPrimary, uiStyles.focusVisible)}
				onclick={copy_secret}
			>
				{copied ? messages.copied : messages.copy_secret}
			</button>
		</div>
	</section>
{/if}
