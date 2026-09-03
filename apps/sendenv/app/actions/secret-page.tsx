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
		<Document
			apiBaseUrl={handle.props.apiBaseUrl}
			title="Someone shared a secret with you - Sendenv"
			noIndex
		>
			<div class="stack">
				<section>
					<h1>Someone shared a secret with you</h1>
					<p class="lede">
						This secret can only be opened once. Save any information you need before closing this
						page.
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
