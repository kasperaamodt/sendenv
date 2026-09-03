import type { Handle, SerializableProps } from 'remix/ui';

import { CreateSecret } from '@sendenv/web-ui';

import { create_secret_messages } from '../messages.ts';
import { Document } from './document.tsx';

interface HomePageProps extends SerializableProps {
	apiBaseUrl: string;
}

export function HomePage(handle: Handle<HomePageProps>) {
	return () => (
		<Document title="Hvisk – del privat informasjon trygt">
			<div class="stack">
				<section>
					<h1>Del privat informasjon trygt</h1>
					<p class="lede">
						Det du deler krypteres før det sendes. Bare den som får lenken kan lese det. Vi kan
						heller ikke lese innholdet. Lenken kan bare brukes én gang og utløper automatisk.
					</p>
				</section>

				<CreateSecret apiBaseUrl={handle.props.apiBaseUrl} messages={create_secret_messages} />
			</div>
		</Document>
	);
}
