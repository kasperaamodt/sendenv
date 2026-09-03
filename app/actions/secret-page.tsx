import type { Handle } from 'remix/ui';

import { Document } from './document.tsx';
import { SecretViewer } from './public/secret-viewer.tsx';

interface SecretPageProps {
	contentId: string;
}

export function SecretPage(handle: Handle<SecretPageProps>) {
	return () => (
		<Document title="Someone shared a secret with you - Sendenv" noIndex showNewSecret>
			<div class="stack">
				<section>
					<h1>Someone shared a secret with you</h1>
					<p class="lede">
						This secret can only be opened once. Save any information you need before closing this
						page.
					</p>
				</section>

				<SecretViewer contentId={handle.props.contentId} />
			</div>
		</Document>
	);
}
