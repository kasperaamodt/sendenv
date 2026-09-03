import type { Handle, SerializableProps } from 'remix/ui';

import { CreateSecret } from '@sendenv/web-ui';

import { create_secret_messages } from '../messages.ts';
import { Document } from './document.tsx';

interface HomePageProps extends SerializableProps {
	apiBaseUrl: string;
}

export function HomePage(handle: Handle<HomePageProps>) {
	return () => (
		<Document
			apiBaseUrl={handle.props.apiBaseUrl}
			title="Sendenv - Securely share secrets with anyone"
		>
			<div class="stack">
				<section>
					<h1>Securely share secrets with anyone</h1>
					<p class="lede">
						Your secrets are encrypted in your browser. Only the recipient with the correct link can
						read them. Even we cannot read your secrets. Links expire after 1 hour by default and
						can only be used once.
					</p>
				</section>

				<CreateSecret apiBaseUrl={handle.props.apiBaseUrl} messages={create_secret_messages} />
			</div>
		</Document>
	);
}
