import type { CreateSecretMessages, SecretViewerMessages } from '@sendenv/web-ui';

export const create_secret_messages = {
	aria_label: 'Lag en sikker delingslenke',
	copy_failed: 'Kunne ikke kopiere lenken. Marker den og kopier manuelt.',
	copied: 'Kopiert',
	copy_link: 'Kopier lenken',
	create_link: 'Lag sikker lenke',
	creating_link: 'Lager lenke…',
	empty_secret: 'Skriv eller lim inn noe du vil dele.',
	expiration_label: 'Utløper etter',
	expiration_options: {
		1: '1 time',
		3: '3 timer',
		6: '6 timer',
		12: '12 timer',
		24: '24 timer'
	},
	generic_error: 'Kunne ikke lage lenken. Prøv igjen.',
	javascript_required: 'JavaScript må være på for at innholdet skal kunne krypteres i nettleseren.',
	rate_limited: 'For mange forsøk. Vent litt og prøv igjen.',
	share_link_label: 'Delingslenken din (utløper om {duration})',
	start_over: 'Start på nytt',
	secret_label: 'Innhold du vil dele',
	secret_placeholder: 'Skriv eller lim inn det du vil dele …',
	secret_too_large: 'Innholdet er for langt. Kort det ned og prøv igjen.',
	warning_lead: 'Ikke vis innholdet selv.',
	warning_text: 'Den første som viser innholdet bruker det opp. Det kan ikke vises igjen.'
} satisfies CreateSecretMessages;

export const secret_viewer_messages = {
	copy_failed: 'Kunne ikke kopiere. Marker innholdet og kopier manuelt.',
	copied: 'Kopiert',
	copy_secret: 'Kopier innholdet',
	generic_error: 'Kunne ikke åpne innholdet.',
	invalid_link: 'Lenken er ugyldig.',
	loading: 'Åpner innholdet …',
	not_found: 'Innholdet finnes ikke, har utløpt eller er allerede åpnet.',
	output_label: 'Innhold',
	rate_limited: 'For mange forsøk. Vent litt og prøv igjen.',
	reveal_secret: 'Vis innholdet'
} satisfies SecretViewerMessages;
