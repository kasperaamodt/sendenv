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
				? 'Denne lenken er allerede brukt.'
				: 'Denne lenken er utløpt.';

		return () => (
			<Document title="Lenken er utilgjengelig – Hvisk" noIndex>
				<div class="stack">
					<section>
						<h1>Noen har delt noe privat med deg</h1>
						<p class="lede">
							Innholdet kan bare vises én gang. Trykk Vis innholdet når du er klar, og ta vare på
							det du trenger før du lukker siden.
						</p>
					</section>
					<section class="empty-state">
						<p class="error" role="alert">
							{message}
						</p>
						<div class="actions">
							<a href="/" class="button button-secondary">
								Del noe nytt
							</a>
						</div>
					</section>
				</div>
			</Document>
		);
	}

	return () => (
		<Document title="Noen har delt noe privat med deg – Hvisk" noIndex>
			<div class="stack">
				<section>
					<h1>Noen har delt noe privat med deg</h1>
					<p class="lede">
						Innholdet kan bare vises én gang. Trykk Vis innholdet når du er klar, og ta vare på det
						du trenger før du lukker siden.
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
