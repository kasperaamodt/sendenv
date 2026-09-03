import { clientEntry, on, type Handle, type SerializableProps } from 'remix/ui';

import { decrypt_content, get_access_token, is_valid_key_fragment } from './encryption.ts';

interface SecretViewerProps extends SerializableProps {
	contentId: string;
}

export const SecretViewer = clientEntry(
	import.meta.url,
	function SecretViewer(handle: Handle<SecretViewerProps>) {
		let copied = false;
		let data: string | null = null;
		let error: string | null = null;
		let loading = true;

		handle.queueTask(async (signal) => {
			try {
				const key = window.location.hash.slice(1);
				if (!is_valid_key_fragment(key)) throw new Error('Invalid URL');
				const accessToken = await get_access_token(key);

				const response = await fetch(`/api/secrets/${encodeURIComponent(handle.props.contentId)}`, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						Authorization: `Sendenv ${accessToken}`,
						'X-Sendenv-Consume': '1'
					},
					signal
				});

				if (!response.ok) {
					throw new Error((await response.text()) || 'Secret not found');
				}

				const payload = (await response.json()) as { data?: unknown };
				if (typeof payload.data !== 'string') throw new Error('Invalid server response');

				data = await decrypt_content(payload.data, key, handle.props.contentId);
			} catch (cause) {
				if (signal.aborted) return;
				error = cause instanceof Error ? cause.message : String(cause);
			} finally {
				if (!signal.aborted) {
					loading = false;
					handle.update();
				}
			}
		});

		async function copySecret() {
			if (!data) return;

			try {
				await navigator.clipboard.writeText(data);
				copied = true;
				error = null;
			} catch {
				error = 'Could not copy the secret. Select it and copy it manually.';
			}

			handle.update();
		}

		return () => (
			<section aria-live="polite">
				{loading ? (
					<div class="loading">
						<span class="spinner" aria-hidden="true"></span>
						<span>Decrypting</span>
					</div>
				) : error && !data ? (
					<p class="error" role="alert">
						{error}
					</p>
				) : (
					<div class="stack-small">
						<div class="field">
							<label htmlFor="secret-output">Shared secret</label>
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
							<button type="button" class="button button-primary" mix={on('click', copySecret)}>
								{copied ? 'Copied' : 'Copy secret'}
							</button>
						</div>
					</div>
				)}
			</section>
		);
	}
);
