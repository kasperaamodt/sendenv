import { clientEntry, on, type Handle, type SerializableProps } from 'remix/ui';

import {
	ApiError,
	EXPIRATION_HOURS,
	MAX_SECRET_BYTES,
	create_api_client,
	encrypt_secret,
	get_secret_byte_length,
	type ExpirationHours
} from '@sendenv/sdk';

import type { CreateSecretMessages } from './messages.ts';

interface CreateSecretProps extends SerializableProps {
	apiBaseUrl: string;
	messages: CreateSecretMessages;
}

export const CreateSecret = clientEntry(
	import.meta.url,
	function CreateSecret(handle: Handle<CreateSecretProps>) {
		const api = create_api_client(handle.props.apiBaseUrl);
		const { messages } = handle.props;
		let copied = false;
		let error: string | null = null;
		let expiration: ExpirationHours = 1;
		let hydrated = false;
		let loading = false;
		let share_url: string | null = null;

		handle.queueTask(() => {
			hydrated = true;
			handle.update();
		});

		async function copy_share_url() {
			if (!share_url) return;

			try {
				await navigator.clipboard.writeText(share_url);
				copied = true;
				error = null;
			} catch {
				error = messages.copy_failed;
			}

			handle.update();
		}

		return () => (
			<section aria-label={messages.aria_label}>
				{share_url ? (
					<div class="share-result">
						<div class="field">
							<label htmlFor="share-url">
								{messages.share_link_label.replace(
									'{duration}',
									messages.expiration_options[expiration]
								)}
							</label>
							<output id="share-url" class="share-link">
								{share_url}
							</output>
						</div>

						<p class="warning">
							<strong>{messages.warning_lead}</strong> {messages.warning_text}
						</p>

						{error ? (
							<p class="error" role="alert">
								{error}
							</p>
						) : null}

						<div class="actions">
							<button
								type="button"
								class="button button-secondary"
								mix={on('click', () => {
									copied = false;
									error = null;
									expiration = 1;
									share_url = null;
									handle.update();
								})}
							>
								{messages.start_over}
							</button>
							<button type="button" class="button button-primary" mix={on('click', copy_share_url)}>
								{copied ? messages.copied : messages.copy_link}
							</button>
						</div>
					</div>
				) : (
					<form
						class="secret-form"
						autoComplete="off"
						mix={on('submit', async (event, signal) => {
							event.preventDefault();
							if (!hydrated || loading) return;

							const form_data = new FormData(event.currentTarget);
							const data = form_data.get('data');
							const selected_expiration = Number(form_data.get('expiration') ?? 1);
							const expires_in_hours: ExpirationHours =
								EXPIRATION_HOURS.find((hours) => hours === selected_expiration) ?? 1;

							if (typeof data !== 'string' || !data.trim()) {
								error = messages.empty_secret;
								handle.update();
								return;
							}
							if (get_secret_byte_length(data) > MAX_SECRET_BYTES) {
								error = messages.secret_too_large;
								handle.update();
								return;
							}

							error = null;
							loading = true;
							await handle.update();

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
								if (!signal.aborted) {
									loading = false;
									handle.update();
								}
							}
						})}
					>
						<label class="sr-only" htmlFor="secret-data">
							{messages.secret_label}
						</label>
						<textarea
							id="secret-data"
							name="data"
							class="text-area"
							placeholder={messages.secret_placeholder}
							rows={6}
						></textarea>

						{error ? (
							<p class="error" role="alert">
								{error}
							</p>
						) : null}

						<div class="actions">
							<label class="sr-only" htmlFor="expiration">
								{messages.expiration_label}
							</label>
							<select id="expiration" name="expiration" class="select">
								{EXPIRATION_HOURS.map((hours) => (
									<option value={hours} selected={hours === 1}>
										{messages.expiration_options[hours]}
									</option>
								))}
							</select>
							<button type="submit" class="button button-primary" disabled={!hydrated || loading}>
								{loading ? messages.creating_link : messages.create_link}
							</button>
						</div>
						<noscript>{messages.javascript_required}</noscript>
					</form>
				)}
			</section>
		);
	}
);

function create_error_message(cause: unknown, messages: CreateSecretMessages): string {
	if (cause instanceof ApiError) {
		if (cause.code === 'SECRET_TOO_LARGE') return messages.secret_too_large;
		if (cause.code === 'RATE_LIMITED') return messages.rate_limited;
	}
	return messages.generic_error;
}
