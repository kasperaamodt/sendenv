import { clientEntry, on, ref, type Handle, type SerializableProps } from 'remix/ui';

import { encrypt_content } from './encryption.ts';

export const CreateSecret = clientEntry(
	import.meta.url,
	function CreateSecret(handle: Handle<SerializableProps>) {
		let copied = false;
		let error: string | null = null;
		let expiration = 1;
		let hydrated = false;
		let loading = false;
		let shareUrl: string | null = null;
		let textarea: HTMLTextAreaElement | undefined;

		handle.queueTask(() => {
			hydrated = true;
			handle.update();
		});

		async function copyShareUrl() {
			if (!shareUrl) return;

			try {
				await navigator.clipboard.writeText(shareUrl);
				copied = true;
				error = null;
			} catch {
				error = 'Could not copy the link. Select it and copy it manually.';
			}

			handle.update();
		}

		return () => (
			<section aria-label="Create a secret">
				{shareUrl ? (
					<div class="stack-small">
						<div class="field">
							<label htmlFor="share-url">
								Your share link (expires in {expiration} hour{expiration > 1 ? 's' : ''})
							</label>
							<button
								id="share-url"
								type="button"
								class="share-link"
								title="Click to copy"
								mix={on('click', copyShareUrl)}
							>
								{shareUrl}
							</button>
						</div>

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
									shareUrl = null;
									handle.update();
								})}
							>
								Start over
							</button>
							<button type="button" class="button button-primary" mix={on('click', copyShareUrl)}>
								{copied ? 'Copied' : 'Copy link'}
							</button>
						</div>
					</div>
				) : (
					<form
						class="secret-form"
						autoComplete="off"
						mix={on('submit', async (event, signal) => {
							event.preventDefault();
							if (!hydrated || loading || !textarea) return;

							const data = textarea.value;
							const formData = new FormData(event.currentTarget);
							const selectedExpiration = Number(formData.get('expiration') ?? 1);

							if (!data.trim()) {
								error = 'Please enter some text.';
								handle.update();
								return;
							}

							error = null;
							loading = true;
							await handle.update();

							try {
								const { access_verifier, encrypted_data, id, key, version } =
									await encrypt_content(data);
								const response = await fetch('/api/secrets', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										version,
										content_id: id,
										data: encrypted_data,
										access_verifier,
										expiration: selectedExpiration
									}),
									signal
								});

								if (!response.ok) {
									throw new Error((await response.text()) || 'Could not create the link.');
								}

								if (signal.aborted) return;
								expiration = selectedExpiration;
								shareUrl = `${window.location.origin}/s/${id}#${key}`;
							} catch (cause) {
								if (signal.aborted) return;
								error = cause instanceof Error ? cause.message : String(cause);
							} finally {
								if (!signal.aborted) {
									loading = false;
									handle.update();
								}
							}
						})}
					>
						<label class="sr-only" htmlFor="secret-data">
							Secret content
						</label>
						<textarea
							id="secret-data"
							class="text-area"
							placeholder="Enter your secret content here..."
							rows={6}
							mix={ref((element) => {
								textarea = element;
							})}
						></textarea>

						{error ? (
							<p class="error" role="alert">
								{error}
							</p>
						) : null}

						<div class="actions">
							<label class="sr-only" htmlFor="expiration">
								Expiration
							</label>
							<select id="expiration" name="expiration" class="select">
								<option value="1" selected>
									1 hour
								</option>
								<option value="3">3 hours</option>
								<option value="6">6 hours</option>
								<option value="12">12 hours</option>
								<option value="24">24 hours</option>
							</select>
							<button type="submit" class="button button-primary" disabled={!hydrated || loading}>
								{loading ? 'Encrypting...' : 'Generate link'}
							</button>
						</div>
						<noscript>
							JavaScript is required so the secret can be encrypted in your browser.
						</noscript>
					</form>
				)}
			</section>
		);
	}
);
