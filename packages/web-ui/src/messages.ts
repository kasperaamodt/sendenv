import type { SerializableProps } from 'remix/ui';

import type { ExpirationHours } from '@sendenv/sdk';

type ExpirationOptions = Record<ExpirationHours, string> & SerializableProps;

export interface CreateSecretMessages extends SerializableProps {
	aria_label: string;
	copy_failed: string;
	copied: string;
	copy_link: string;
	create_link: string;
	creating_link: string;
	empty_secret: string;
	expiration_label: string;
	expiration_options: ExpirationOptions;
	generic_error: string;
	javascript_required: string;
	rate_limited: string;
	share_link_label: string;
	start_over: string;
	secret_label: string;
	secret_placeholder: string;
	secret_too_large: string;
	warning_lead: string;
	warning_text: string;
}

export interface SecretViewerMessages extends SerializableProps {
	copy_failed: string;
	copied: string;
	copy_secret: string;
	generic_error: string;
	invalid_link: string;
	loading: string;
	new_link?: string;
	not_found: string;
	output_label: string;
	rate_limited: string;
	reveal_secret: string;
}
