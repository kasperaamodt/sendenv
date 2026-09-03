import { Document } from './document.tsx';
import { CreateSecret } from './public/create-secret.tsx';

export function HomePage() {
	return () => (
		<Document title="Sendenv">
			<div class="stack">
				<section>
					<h1>Send secrets securely to anyone</h1>
					<p class="lede">
						Your secrets are encrypted in your browser. Only the recipient with the correct link can
						read them. Even we cannot read your secrets. Links expire after 1 hour by default and
						can only be used once.
					</p>
				</section>

				<CreateSecret />
			</div>
		</Document>
	);
}
