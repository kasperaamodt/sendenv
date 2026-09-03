import { clientEntry, on, type Handle, type SerializableProps } from 'remix/ui';

import {
	ApiError,
	create_api_client,
	decrypt_secret,
	get_access_token,
	is_valid_key_fragment
} from '@sendenv/sdk';

import type { SecretViewerMessages } from './messages.ts';

interface SecretViewerProps extends SerializableProps {
	apiBaseUrl: string;
	contentId: string;
	messages: SecretViewerMessages;
}

const INVALID_LINK = 'INVALID_LINK';

export const SecretViewer = clientEntry(
	import.meta.url,
	function SecretViewer(handle: Handle<SecretViewerProps>) {
		const api = create_api_client(handle.props.apiBaseUrl);
		const { messages } = handle.props;
		let copied = false;
		let data: string | null = null;
		let error: string | null = null;
		let hydrated = false;
		let loading = false;

		handle.queueTask(() => {
			hydrated = true;
			handle.update();
		});

		async function reveal_secret(signal: AbortSignal) {
			if (!hydrated || loading || data) return;

			error = null;
			loading = true;
			await handle.update();

			try {
				const root_key = window.location.hash.slice(1);
				if (!is_valid_key_fragment(root_key)) throw new Error(INVALID_LINK);
				const access_token = await get_access_token(root_key);
				const payload = await api.consume_secret(handle.props.contentId, access_token, signal);

				data = await decrypt_secret(payload.ciphertext, root_key, handle.props.contentId);
			} catch (cause) {
				if (signal.aborted) return;
				error = consume_error_message(cause, messages);
			} finally {
				if (!signal.aborted) {
					loading = false;
					handle.update();
				}
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

			handle.update();
		}

		return () => (
			<section aria-live="polite">
				{loading ? (
					<div class="loading">
						<span class="spinner" aria-hidden="true"></span>
						<span>{messages.loading}</span>
					</div>
				) : error && !data ? (
					<div class="empty-state">
						<p class="error" role="alert">
							{error}
						</p>
						{messages.new_link ? (
							<a href="/" class="text-link">
								{messages.new_link}
							</a>
						) : null}
					</div>
				) : data ? (
					<div class="stack-small">
						<div class="field">
							<label htmlFor="secret-output">{messages.output_label}</label>
							<textarea
								id="secret-output"
								rows={10}
								readOnly
								class="text-area"
								value={data ?? ''}
							></textarea>
						</div>

						{error ? (
							<p class="error" role="alert">
								{error}
							</p>
						) : null}

						<div class="actions">
							<button type="button" class="button button-primary" mix={on('click', copy_secret)}>
								{copied ? messages.copied : messages.copy_secret}
							</button>
						</div>
					</div>
				) : (
					<div class="actions">
						<button
							type="button"
							class="button button-primary"
							disabled={!hydrated}
							mix={on('click', (_event, signal) => reveal_secret(signal))}
						>
							{messages.reveal_secret}
						</button>
					</div>
				)}
			</section>
		);
	}
);

function consume_error_message(cause: unknown, messages: SecretViewerMessages): string {
	if (cause instanceof Error && cause.message === INVALID_LINK) return messages.invalid_link;
	if (cause instanceof ApiError && cause.code === 'SECRET_NOT_FOUND') return messages.not_found;
	if (cause instanceof ApiError && cause.code === 'RATE_LIMITED') return messages.rate_limited;
	return messages.generic_error;
}
