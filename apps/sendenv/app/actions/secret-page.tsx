import type { Handle, SerializableProps } from 'remix/ui';

import type { SecretStatus } from '@sendenv/sdk';
import { SecretViewer } from '@sendenv/web-ui';

import { secret_viewer_messages } from '../messages.ts';
import { Document } from './document.tsx';

interface SecretPageProps extends SerializableProps {
	apiBaseUrl: string;
	contentId: string;
	status: SecretStatus;
}

export function SecretPage(handle: Handle<SecretPageProps>) {
	if (handle.props.status !== 'available') {
		const message =
			handle.props.status === 'consumed'
				? 'This link has already been used.'
				: 'This link has expired.';

		return () => (
			<Document
				apiBaseUrl={handle.props.apiBaseUrl}
				title="Secret link unavailable - Sendenv"
				noIndex
			>
				<div class="stack">
					<section>
						<h1>Someone shared a secret with you</h1>
						<p class="lede">
							This secret can only be revealed once. Select Reveal secret when you are ready, then
							save any information you need before closing this page.
						</p>
					</section>
					<section class="empty-state">
						<p class="error" role="alert">
							{message}
						</p>
						<div class="actions">
							<a href="/" class="button button-secondary">
								Create a new secret
							</a>
						</div>
					</section>
				</div>
			</Document>
		);
	}

	return () => (
		<Document
			apiBaseUrl={handle.props.apiBaseUrl}
			title="Someone shared a secret with you - Sendenv"
			noIndex
		>
			<div class="stack">
				<section>
					<h1>Someone shared a secret with you</h1>
					<p class="lede">
						This secret can only be revealed once. Select Reveal secret when you are ready, then
						save any information you need before closing this page.
					</p>
				</section>

				<SecretViewer
					apiBaseUrl={handle.props.apiBaseUrl}
					contentId={handle.props.contentId}
					messages={secret_viewer_messages}
				/>
			</div>
		</Document>
	);
}
