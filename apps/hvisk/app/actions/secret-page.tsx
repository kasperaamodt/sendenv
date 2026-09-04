import type { Handle, SerializableProps } from 'remix/ui';

import { SecretViewer } from '@sendenv/web-ui';

import { secret_viewer_messages } from '../messages.ts';
import { Document } from './document.tsx';

interface SecretPageProps extends SerializableProps {
	apiBaseUrl: string;
	contentId: string;
}

export function SecretPage(handle: Handle<SecretPageProps>) {
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
