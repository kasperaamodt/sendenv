import * as stylex from '@stylexjs/stylex';

export const uiStyles = stylex.create({
	siteHeader: {
		display: 'flex',
		alignItems: {
			default: 'center',
			'@media (max-width: 34rem)': 'flex-start'
		},
		justifyContent: 'space-between',
		width: 'min(100%, 48rem)',
		margin: '0 auto',
		padding: '0.5rem 1rem'
	},
	logoLink: {
		display: 'inline-flex',
		alignItems: 'center',
		cursor: 'pointer'
	},
	logo: {
		display: 'block',
		width: 'auto',
		height: '1.875rem',
		pointerEvents: 'none',
		userSelect: 'none'
	},
	siteNav: {
		display: 'flex',
		alignItems: 'center',
		gap: {
			default: '0.75rem',
			'@media (max-width: 34rem)': '0.5rem'
		}
	},
	navLink: {
		color: {
			default: '#374151',
			':hover': '#111827'
		},
		fontSize: '0.8125rem',
		fontWeight: 600,
		textDecorationLine: {
			default: 'none',
			':hover': 'underline'
		},
		textUnderlineOffset: '0.2em'
	},
	iconLink: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '1.5rem',
		height: '1.5rem',
		color: '#374151'
	},
	navIcon: {
		width: '1rem',
		height: '1rem',
		strokeWidth: 2,
		strokeLinecap: 'round',
		strokeLinejoin: 'round'
	},
	pageShell: {
		width: 'min(100%, 48rem)',
		margin: '0.5rem auto 0',
		padding: '1rem'
	},
	stack: {
		display: 'grid',
		gap: '2rem'
	},
	stackSmall: {
		display: 'grid',
		gap: '0.75rem'
	},
	heading: {
		margin: 0,
		fontFamily: "'Gilroy', ui-sans-serif, system-ui, sans-serif",
		fontSize: '1.5rem',
		fontWeight: 600,
		lineHeight: '2rem',
		textWrap: 'balance'
	},
	lede: {
		margin: '0.5rem 0 0',
		color: '#000000',
		lineHeight: 1.5,
		textWrap: 'pretty'
	},
	secretForm: {
		display: 'grid',
		gap: '0.5rem'
	},
	field: {
		display: 'grid',
		gap: '0.5rem'
	},
	fieldLabel: {
		fontSize: '0.875rem',
		fontWeight: 500
	},
	control: {
		width: '100%',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: '#e5e7eb',
		borderRadius: '0.375rem',
		backgroundColor: '#ffffff',
		color: '#111827'
	},
	textArea: {
		resize: 'vertical',
		padding: '0.625rem',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		fontSize: '1rem',
		lineHeight: 1.5,
		'::placeholder': {
			color: '#9ca3af'
		}
	},
	outputTextArea: {
		display: 'block'
	},
	select: {
		width: 'auto',
		appearance: 'none',
		padding: '0.5rem 2.5rem 0.5rem 0.75rem',
		backgroundImage:
			"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239BA1AD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
		backgroundPosition: 'right 0.5rem center',
		backgroundRepeat: 'no-repeat',
		backgroundSize: '1.5em 1.5em'
	},
	shareLink: {
		display: 'block',
		color: '#374151',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		fontSize: '0.9375rem',
		lineHeight: 1.5,
		overflowWrap: 'anywhere',
		userSelect: 'text'
	},
	shareResult: {
		display: 'grid',
		gap: '1rem'
	},
	shareActions: {
		marginTop: '0.5rem'
	},
	secretOutput: {
		position: 'relative'
	},
	secretOutputConcealed: {
		'::before': {
			position: 'absolute',
			inset: '0.75rem',
			backgroundImage:
				'repeating-linear-gradient(to bottom, #d1d5db 0, #d1d5db 0.75rem, #f3f4f6 0.75rem, transparent 1.5rem)',
			content: "''",
			filter: 'blur(14px)',
			opacity: 0.45,
			pointerEvents: 'none'
		}
	},
	revealOverlay: {
		position: 'absolute',
		inset: '1px',
		display: 'grid',
		placeItems: 'center',
		borderRadius: '0.3125rem',
		backgroundColor: 'rgb(255 255 255 / 68%)',
		backdropFilter: 'blur(12px)'
	},
	actions: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: '0.5rem',
		flexWrap: {
			default: 'nowrap',
			'@media (max-width: 34rem)': 'wrap'
		}
	},
	secretActions: {
		flexWrap: 'nowrap'
	},
	button: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '2.375rem',
		borderRadius: '0.375rem',
		padding: '0.5rem 1rem',
		fontSize: '0.875rem',
		fontWeight: 600,
		textDecorationLine: 'none',
		cursor: {
			default: 'pointer',
			':disabled': 'not-allowed'
		},
		opacity: {
			default: 1,
			':disabled': 0.5
		},
		scale: {
			default: null,
			':active:not(:disabled)': {
				default: 0.96,
				'@media (prefers-reduced-motion: reduce)': 1
			}
		},
		transitionProperty: {
			default: 'background-color, color',
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		transitionDuration: '120ms'
	},
	buttonPrimary: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: {
			default: '#000000',
			':hover:not(:disabled)': {
				default: '#000000',
				'@media (hover: hover)': '#1f2937'
			}
		},
		color: '#ffffff'
	},
	buttonSecondary: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: {
			default: '#f3f4f6',
			':hover:not(:disabled)': {
				default: '#f3f4f6',
				'@media (hover: hover)': '#e5e7eb'
			}
		},
		color: '#111827'
	},
	error: {
		margin: 0,
		color: '#dc2626',
		fontSize: '0.875rem',
		whiteSpace: 'pre-wrap'
	},
	warning: {
		margin: 0,
		color: '#4b5563',
		fontSize: '0.875rem',
		lineHeight: 1.5
	},
	warningStrong: {
		color: '#111827'
	},
	emptyState: {
		display: 'grid',
		gap: '1rem'
	},
	textLink: {
		width: 'fit-content',
		fontSize: '0.875rem',
		fontWeight: 600,
		textUnderlineOffset: '0.2em'
	},
	srOnly: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	noScript: {
		display: 'block',
		marginTop: '0.75rem',
		color: '#dc2626',
		fontSize: '0.875rem'
	},
	focus: {
		outlineWidth: {
			default: null,
			':focus': '2px'
		},
		outlineStyle: {
			default: null,
			':focus': 'solid'
		},
		outlineColor: {
			default: null,
			':focus': '#111827'
		},
		outlineOffset: {
			default: null,
			':focus': '2px'
		}
	},
	focusVisible: {
		outlineWidth: {
			default: null,
			':focus-visible': '2px'
		},
		outlineStyle: {
			default: null,
			':focus-visible': 'solid'
		},
		outlineColor: {
			default: null,
			':focus-visible': '#111827'
		},
		outlineOffset: {
			default: null,
			':focus-visible': '2px'
		}
	}
});
