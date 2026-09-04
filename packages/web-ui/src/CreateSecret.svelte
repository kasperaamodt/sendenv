<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import * as stylex from '@stylexjs/stylex';

	import {
		ApiError,
		EXPIRATION_HOURS,
		MAX_SECRET_BYTES,
		create_api_client,
		encrypt_secret,
		get_secret_byte_length,
		type ExpirationHours
	} from '@sendenv/sdk';

	import type { CreateSecretMessages } from './messages';
	import { uiStyles } from './styles';

	interface Props {
		apiBaseUrl: string;
		messages: CreateSecretMessages;
	}

	let { apiBaseUrl, messages }: Props = $props();
	const api = $derived(create_api_client(apiBaseUrl));
	let copied = $state(false);
	let error = $state<string | null>(null);
	let expiration = $state<ExpirationHours>(1);
	let hydrated = $state(false);
	let loading = $state(false);
	let share_url = $state<string | null>(null);
	let submission_controller: AbortController | null = null;

	onMount(() => {
		hydrated = true;
	});

	onDestroy(() => submission_controller?.abort());

	async function copy_share_url() {
		if (!share_url) return;

		try {
			await navigator.clipboard.writeText(share_url);
			copied = true;
			error = null;
		} catch {
			error = messages.copy_failed;
		}
	}

	function start_over() {
		copied = false;
		error = null;
		expiration = 1;
		share_url = null;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!hydrated || loading || !(event.currentTarget instanceof HTMLFormElement)) return;

		const form_data = new FormData(event.currentTarget);
		const data = form_data.get('data');
		const selected_expiration = Number(form_data.get('expiration') ?? 1);
		const expires_in_hours: ExpirationHours =
			EXPIRATION_HOURS.find((hours) => hours === selected_expiration) ?? 1;

		if (typeof data !== 'string' || !data.trim()) {
			error = messages.empty_secret;
			return;
		}
		if (get_secret_byte_length(data) > MAX_SECRET_BYTES) {
			error = messages.secret_too_large;
			return;
		}

		error = null;
		loading = true;
		await tick();
		submission_controller = new AbortController();
		const { signal } = submission_controller;

		try {
			const encrypted = await encrypt_secret(data);
			await api.create_secret(
				{
					version: encrypted.version,
					contentId: encrypted.contentId,
					ciphertext: encrypted.ciphertext,
					accessVerifier: encrypted.accessVerifier,
					expiresInHours: expires_in_hours
				},
				signal
			);

			if (signal.aborted) return;
			expiration = expires_in_hours;
			share_url = `${window.location.origin}/s/${encrypted.contentId}#${encrypted.rootKey}`;
		} catch (cause) {
			if (signal.aborted) return;
			error = create_error_message(cause, messages);
		} finally {
			if (!signal.aborted) loading = false;
			submission_controller = null;
		}
	}

	function create_error_message(cause: unknown, copy: CreateSecretMessages): string {
		if (cause instanceof ApiError) {
			if (cause.code === 'SECRET_TOO_LARGE') return copy.secret_too_large;
			if (cause.code === 'RATE_LIMITED') return copy.rate_limited;
		}
		return copy.generic_error;
	}
</script>

<section aria-label={messages.aria_label}>
	{#if share_url}
		<div {...stylex.attrs(uiStyles.shareResult)}>
			<div {...stylex.attrs(uiStyles.field)}>
				<label for="share-url" {...stylex.attrs(uiStyles.fieldLabel)}>
					{messages.share_link_label.replace('{duration}', messages.expiration_options[expiration])}
				</label>
				<output id="share-url" {...stylex.attrs(uiStyles.shareLink)}>{share_url}</output>
			</div>

			<p {...stylex.attrs(uiStyles.warning)}>
				<strong {...stylex.attrs(uiStyles.warningStrong)}>{messages.warning_lead}</strong>
				{messages.warning_text}
			</p>

			{#if error}
				<p {...stylex.attrs(uiStyles.error)} role="alert">{error}</p>
			{/if}

			<div {...stylex.attrs(uiStyles.actions, uiStyles.shareActions)}>
				<button
					type="button"
					{...stylex.attrs(uiStyles.button, uiStyles.buttonSecondary, uiStyles.focusVisible)}
					onclick={start_over}>{messages.start_over}</button
				>
				<button
					type="button"
					{...stylex.attrs(uiStyles.button, uiStyles.buttonPrimary, uiStyles.focusVisible)}
					onclick={copy_share_url}>{copied ? messages.copied : messages.copy_link}</button
				>
			</div>
		</div>
	{:else}
		<form autocomplete="off" {...stylex.attrs(uiStyles.secretForm)} onsubmit={submit}>
			<label for="secret-data" {...stylex.attrs(uiStyles.srOnly)}>{messages.secret_label}</label>
			<textarea
				id="secret-data"
				name="data"
				placeholder={messages.secret_placeholder}
				rows="6"
				{...stylex.attrs(uiStyles.control, uiStyles.textArea, uiStyles.focus)}></textarea>

			{#if error}
				<p {...stylex.attrs(uiStyles.error)} role="alert">{error}</p>
			{/if}

			<div {...stylex.attrs(uiStyles.actions)}>
				<label for="expiration" {...stylex.attrs(uiStyles.srOnly)}>
					{messages.expiration_label}
				</label>
				<select
					id="expiration"
					name="expiration"
					{...stylex.attrs(uiStyles.control, uiStyles.select, uiStyles.focus)}
				>
					{#each EXPIRATION_HOURS as hours (hours)}
						<option value={hours} selected={hours === 1}>
							{messages.expiration_options[hours]}
						</option>
					{/each}
				</select>
				<button
					type="submit"
					disabled={!hydrated || loading}
					{...stylex.attrs(uiStyles.button, uiStyles.buttonPrimary, uiStyles.focusVisible)}
				>
					{loading ? messages.creating_link : messages.create_link}
				</button>
			</div>
			<noscript {...stylex.attrs(uiStyles.noScript)}>{messages.javascript_required}</noscript>
		</form>
	{/if}
</section>
