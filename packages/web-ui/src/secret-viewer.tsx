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
		let availability: 'checking' | 'available' | 'unavailable' = 'checking';
		let loading = false;

		handle.queueTask(async (signal) => {
			try {
				const root_key = window.location.hash.slice(1);
				if (!is_valid_key_fragment(root_key)) throw new Error(INVALID_LINK);
				const access_token = await get_access_token(root_key);
				const available = await api.is_secret_available(
					handle.props.contentId,
					access_token,
					signal
				);
				if (signal.aborted) return;

				availability = available ? 'available' : 'unavailable';
				if (!available) error = messages.not_found;
			} catch (cause) {
				if (signal.aborted) return;
				availability = 'unavailable';
				error = consume_error_message(cause, messages);
			}

			handle.update();
		});

		async function reveal_secret() {
			if (availability !== 'available' || loading || data) return;

			error = null;
			loading = true;
			await handle.update();

			try {
				const root_key = window.location.hash.slice(1);
				if (!is_valid_key_fragment(root_key)) throw new Error(INVALID_LINK);
				const access_token = await get_access_token(root_key);
				const payload = await api.consume_secret(handle.props.contentId, access_token);

				data = await decrypt_secret(payload.ciphertext, root_key, handle.props.contentId);
			} catch (cause) {
				error = consume_error_message(cause, messages);
			} finally {
				loading = false;
				handle.update();
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
			<section class="stack-small" aria-live="polite">
				<div class="field">
					<label htmlFor="secret-output">{messages.output_label}</label>
					<div class={`secret-output${data ? '' : ' secret-output-concealed'}`}>
						<textarea
							id="secret-output"
							rows={10}
							readOnly
							class="text-area"
							value={data ?? ''}
						></textarea>
						{data ? null : (
							<div class="reveal-overlay">
								{availability === 'checking' ? (
									<div class="loading">
										<span class="spinner" aria-hidden="true"></span>
										<span>{messages.checking}</span>
									</div>
								) : availability === 'available' ? (
									<button
										type="button"
										class="button button-primary"
										disabled={loading}
										mix={on('click', () => reveal_secret())}
									>
										{loading ? messages.loading : messages.reveal_secret}
									</button>
								) : null}
							</div>
						)}
					</div>
				</div>

				{error ? (
					<p class="error" role="alert">
						{error}
					</p>
				) : null}

				<div class="actions secret-actions">
					<a href="/" class="button button-secondary">
						{messages.new_secret}
					</a>
					<button
						type="button"
						class="button button-primary"
						disabled={!data}
						mix={on('click', copy_secret)}
					>
						{copied ? messages.copied : messages.copy_secret}
					</button>
				</div>
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
