import type { Handle, RemixNode } from 'remix/ui';

import { entryHref, stylesheetHref } from '../assets.ts';
import { Header } from './header.tsx';

const description =
	'Del sensitiv informasjon trygt med en kryptert lenke som bare virker én gang. Ingen konto nødvendig.';

interface DocumentProps {
	children?: RemixNode;
	title: string;
	noIndex?: boolean;
}

export function Document(handle: Handle<DocumentProps>) {
	return () => {
		const { children, noIndex = false, title } = handle.props;

		return (
			<html lang="no">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta name="description" content={description} />
					<meta property="og:description" content={description} />
					<meta property="og:type" content="website" />
					<meta property="og:site_name" content="Hvisk" />
					<meta property="og:title" content={title} />
					<meta property="og:locale" content="nb_NO" />
					<meta name="twitter:card" content="summary" />
					<meta name="twitter:description" content={description} />
					<meta name="twitter:title" content={title} />
					{noIndex ? <meta name="robots" content="noindex" /> : null}
					<title>{title}</title>
					<link rel="icon" href="/favicon.svg" />
					<link
						rel="preload"
						href="/gilroy-semibold.woff2"
						as="font"
						type="font/woff2"
						crossOrigin="anonymous"
					/>
					<link rel="stylesheet" href={stylesheetHref} />
				</head>
				<body>
					<Header />
					<main class="page-shell">{children}</main>
					<script type="module" src={entryHref}></script>
				</body>
			</html>
		);
	};
}
