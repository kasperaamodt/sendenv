import type { CreateSecretMessages, SecretViewerMessages } from '@sendenv/web-ui';

export const create_secret_messages = {
	aria_label: 'Create a secret',
	copy_failed: 'Could not copy the link. Select it and copy it manually.',
	copied: 'Copied',
	copy_link: 'Copy link',
	create_link: 'Generate link',
	creating_link: 'Encrypting…',
	empty_secret: 'Please enter some text.',
	expiration_label: 'Expiration',
	expiration_options: {
		1: '1 hour',
		3: '3 hours',
		6: '6 hours',
		12: '12 hours',
		24: '24 hours'
	},
	generic_error: 'Could not create the link. Try again.',
	javascript_required: 'JavaScript is required so the secret can be encrypted in your browser.',
	rate_limited: 'Too many attempts. Wait a moment and try again.',
	share_link_label: 'Your share link (expires in {duration})',
	start_over: 'Start over',
	secret_label: 'Secret content',
	secret_placeholder: 'Enter your secret content here…',
	secret_too_large: 'Secret is too large. Shorten it and try again.',
	warning_lead: 'Do not reveal this secret yourself.',
	warning_text: 'The first person to reveal it consumes the secret, and it cannot be viewed again.'
} satisfies CreateSecretMessages;

export const secret_viewer_messages = {
	checking: 'Checking link…',
	copy_failed: 'Could not copy the secret. Select it and copy it manually.',
	copied: 'Copied',
	copy_secret: 'Copy secret',
	generic_error: 'Could not open the secret.',
	invalid_link: 'The link is invalid.',
	loading: 'Decrypting…',
	new_secret: 'Create a new secret',
	not_found: 'The secret does not exist, has expired, or has already been opened.',
	output_label: 'Shared secret',
	rate_limited: 'Too many attempts. Wait a moment and try again.',
	reveal_secret: 'Reveal secret'
} satisfies SecretViewerMessages;
