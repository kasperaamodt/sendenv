import type { Handle, RemixNode } from 'remix/ui';

import { entryHref, stylesheetHref } from '../assets.ts';
import { Header } from './header.tsx';

const description =
	'Securely share sensitive info with Sendenv. End-to-end encrypted for sharing env vars, API keys, and secrets.';

interface DocumentProps {
	apiBaseUrl: string;
	children?: RemixNode;
	title: string;
	noIndex?: boolean;
}

export function Document(handle: Handle<DocumentProps>) {
	return () => {
		const { apiBaseUrl, children, noIndex = false, title } = handle.props;

		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta name="description" content={description} />
					<meta property="og:description" content={description} />
					<meta property="og:image" content="https://sendenv.app/og.png" />
					<meta property="og:type" content="website" />
					<meta property="og:site_name" content="Sendenv" />
					<meta property="og:title" content={title} />
					<meta name="twitter:card" content="summary_large_image" />
					<meta name="twitter:description" content={description} />
					<meta name="twitter:image" content="https://sendenv.app/og.png" />
					<meta name="twitter:image:alt" content="Sendenv logo" />
					<meta name="twitter:title" content={title} />
					{noIndex ? <meta name="robots" content="noindex" /> : null}
					<title>{title}</title>
					<link rel="icon" href="/favicon.ico" />
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
					<Header apiBaseUrl={apiBaseUrl} />
					<main class="page-shell">{children}</main>
					<script type="module" src={entryHref}></script>
				</body>
			</html>
		);
	};
}
